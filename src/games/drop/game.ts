import fruitsJSON from "../../compileTime/generated/fruits.json";
import gameJSON from "../../compileTime/generated/game.json";

import { DropGameDifficulty } from "../../settings";
import { drawFrame, Prepared as PreparedDraw, prepare as prepareDraw, prepareQuestX } from "./draw";
import { loadImgs, LoadedImg, randomLoadedImg, TransformedImgsJSON } from "../../compileTime/generated";
import { InitSettings } from "../..";
import { mergeDeep, RecursivePartial } from "../../gui/utils";
import drawLoading from "../../gui/loading";
import prepareGui from "../../gui/prepare";
import drawBackground from "../../gui/background";

const generateTarget = (is: InitSettings, state: DropState) => {
  const x = state.gameplay.prepared.clickableGameX + Math.random() * state.gameplay.prepared.clickableGameWidth, y = 1000;
  const word = randomLoadedImg(state.gameplay.targets.candidates);
  if (state.gameplay.targets.candidates.length == 0 || (state.gameplay.targets.candidates.length == 1 && state.gameplay.words.length <= 2)) {
    state.gameplay.targets.candidates = [...state.gameplay.words];
  } else if (state.gameplay.targets.candidates.length == 1) {
    state.gameplay.targets.candidates = state.gameplay.words.filter((word) => word != state.gameplay.targets.candidates[0]);
  } else {
    state.gameplay.targets.candidates.splice(state.gameplay.targets.candidates.indexOf(word), 1);
  }
  return { word, x, y, timeGenerated: state.lastTick };
}

const generateQuest = (is: InitSettings, words: LoadedImg[], state?: DropState) => {
  is.ctx.font = is.fonts.ctxFont;
  let wordsAvailable = words;
  if (state) {
    const remaining = state.gameplay.words.filter((word) => state.gameplay.score.perWord[word.name] < state.gameplay.score.requiredPerWord);
    if (remaining.length == 1) {
      wordsAvailable = remaining;
    } else if (remaining.length > 0) {
      wordsAvailable = remaining.filter((word) => word != state.gameplay.quest.word);
    }
  }
  const word = randomLoadedImg(wordsAvailable);
  return { word, timeGenerated: state?.lastTick || Date.now() };
}

const calcGameplay = (is: InitSettings, state: DropState) => {
  state.gameplay.targets.a.forEach((target, i) => {
    const isMiss = (target.y < is.dropGame.progressBarY - target.word.img.height);
    const isHit = (Math.abs(state.gameplay.hero.x - target.x) <= is.hero.width) && (Math.abs(state.gameplay.hero.y - target.y) <= is.hero.height);
    const isQuest = (target.word == state.gameplay.quest.word);
    if (isHit && isQuest) {
      if (state.gameplay.score.perWord[state.gameplay.quest.word.name] < state.gameplay.score.requiredPerWord) {
        state.gameplay.score.perWord[state.gameplay.quest.word.name] += 1;
        state.gameplay.score.total += 1;
        state.gameplay.score.lastScoreIncreasedTime = state.lastTick;
      }
      if (state.gameplay.score.total == state.gameplay.score.required) {
        state.gameplay.score.wonTime = state.lastTick;
      } else {
        state.gameplay.quest = generateQuest(is, state.gameplay.words, state);
        state.gui.prepared.questX = prepareQuestX(is, state.gameplay.quest.word.name);
      }
    } else if ((isMiss && isQuest) || (isHit && !isQuest)) {
      state.gameplay.score.health = state.gameplay.score.health - 1;
      state.gameplay.score.lastHealthLostTime = state.lastTick;
      if (state.gameplay.score.health == 0) {
        state.gameplay.score.loseTime = state.lastTick;
      }
    }
    if (isHit || isMiss) state.gameplay.targets.a.splice(i, 1);
  });
  // generate new
  if (state.gameplay.targets.a.length == 0 || state.lastTick - state.gameplay.targets.lastTimeGenerated >= state.gameplay.targets.cd) {
    state.gameplay.targets.a.push(generateTarget(is, state));
    state.gameplay.targets.lastTimeGenerated = state.lastTick;
  }
}

const calcNextFrame = (is: InitSettings, state: DropState) => {
  if (state.gui.mouse.x > -1) {
    if (state.gameplay.hero.x > state.gui.mouse.x - is.hero.width / 2)
      state.gameplay.hero.x = Math.max(state.gameplay.hero.x - state.gameplay.hero.speed, state.gui.mouse.x - is.hero.width / 2); 
    else 
      state.gameplay.hero.x = Math.min(state.gameplay.hero.x + state.gameplay.hero.speed, state.gui.mouse.x- is.hero.width / 2);
    // fix
    state.gameplay.hero.x = Math.max(is.prepared.gameX, Math.min(state.gameplay.prepared.clickableGameXMax, state.gameplay.hero.x));
  }
  let speed = state.gameplay.targets.speed;
  if (state.gui.accelerationKB || state.gui.accelerationMouse) speed *= is.dropGame.acceleration;
  state.gameplay.targets.a.forEach((target) => target.y -= speed);
}

const calcNextLoseFrame = (is: InitSettings, state: DropState) => {
  // move & remove
  let speed = is.dropGame.difficulties.movie.targets.speed;
  state.gameplay.targets.a.forEach((target, i) => {
    if (target.y < is.dropGame.progressBarY - target.word.img.height) {
      state.gameplay.targets.a.splice(i, 1);
      state.gameplay.score.lastHealthLostTime = state.lastTick;
    } 
    else target.y -= speed;
  });
  // generate new
  if (state.gameplay.targets.a.length == 0 || state.lastTick - state.gameplay.targets.lastTimeGenerated >= is.dropGame.difficulties.movie.targets.cd) {
    let target = generateTarget(is, state);
    for (let i = 0; i < 10 && Math.abs(target.x - state.gameplay.hero.x) < is.hero.width * 2; i++)
      target.x = is.prepared.gameX + Math.random() * state.gameplay.prepared.clickableGameWidth;
    state.gameplay.targets.a.push(target);
    state.gameplay.targets.lastTimeGenerated = state.lastTick;
  }
}

const calcNextWonFrame = (is: InitSettings, state: DropState) => {
  // move & remove
  state.gameplay.targets.a.forEach((target, i) => {
    const isHit = (Math.abs(state.gameplay.hero.x - target.x) <= is.hero.width) && (Math.abs(state.gameplay.hero.y - target.y) <= is.hero.height);
    if (isHit) {
      // remove
      state.gameplay.targets.a.splice(i, 1);
      state.gameplay.score.lastScoreIncreasedTime = state.lastTick;
      return;
    } else {
      // x move
      if (target.y < state.gameplay.hero.y + is.hero.height * 4) {
        if (target.x > state.gameplay.hero.x) {
          target.x = Math.max(state.gameplay.hero.x, target.x - is.dropGame.difficulties.movie.targets.speed);
        } else {
          target.x = Math.min(state.gameplay.hero.x, target.x + is.dropGame.difficulties.movie.targets.speed);
        }
      }
      // y move
      if (target.y > state.gameplay.hero.y) {
        target.y = Math.max(state.gameplay.hero.y, target.y - is.dropGame.difficulties.movie.targets.speed);
      }
    }
  });
  // generate new
  if (state.gameplay.targets.a.length == 0 || state.lastTick - state.gameplay.targets.lastTimeGenerated >= is.dropGame.difficulties.movie.targets.cd) {
    state.gameplay.targets.a.push(generateTarget(is, state));
    state.gameplay.targets.lastTimeGenerated = state.lastTick;
  }
}

const prepare = (is: InitSettings) => {
  return {
    maxXHero: is.prepared.gameXMax - is.hero.width, 
    maxXTarget: is.prepared.gameXMax - is.hero.width,
    clickableGameX: (is.ctx.canvas.width - is.prepared.gameWidth) / 2 + is.hero.width,
    clickableGameXMax: (is.ctx.canvas.width + is.prepared.gameWidth) / 2 - is.hero.width,
    clickableGameWidth: is.prepared.gameWidth - is.hero.width * 2,
  };
}
type Prepared = ReturnType<typeof prepare>;

export interface DropState {
  // gameplay
  gameplay: {
    words: LoadedImg[],
    quest: { word: LoadedImg, timeGenerated: number },
    prevQuest?: DropState["gameplay"]["quest"],
    targets: {
      a: { word: LoadedImg, x: number, y: number, timeGenerated: number }[],
      candidates: LoadedImg[],
      speed: number,
      lastTimeGenerated: number,
      cd: number,
    }
    hero: { x: number, y: number, speed: number },
    score: {
      health: number,
      total: number, required: number, requiredPerWord: number,
      perWord: { [word: string]: number },
      wonTime?: number, loseTime?: number,
      lastHealthLostTime?: number, lastScoreIncreasedTime?: number,
    },
    prepared: Prepared,
  }
  // gui
  gui: {
    mouse: { x: number, y: number },
    accelerationMouse: boolean, accelerationKB: boolean,
    assets: TransformedImgsJSON<typeof gameJSON>,
    prepared: PreparedDraw,
  }
  lastTick: number,
}

const drop = async (is: InitSettings, dif: DropGameDifficulty, optional?: RecursivePartial<DropState>) => {
  drawLoading(is);
  const [words, assets] = await Promise.all([loadImgs(fruitsJSON, is.hero.width, "width"), loadImgs(gameJSON, is.hero.width, "width")]);

  const stopMove = is.addMoveRequest((x, y) => {
    state.gui.mouse.x = x, state.gui.mouse.y = y;
    state.gui.accelerationMouse = (y <= is.dropGame.progressBarY);
  });
  const stopButton = is.addButtonRequest({
    button: " ", 
    onReleased: () => state.gui.accelerationKB = false,
    onPressed: () => state.gui.accelerationKB = true,
  });
  // general state
  const quest = generateQuest(is, words);
  const state: DropState = {
    gameplay: {
      words,
      hero: { 
        x: is.prepared.gameX + is.prepared.gameWidth / 2, y: is.dropGame.heroY, 
        speed: is.dropGame.mouseSpeed * is.prepared.verticalSpeedMultiplier 
      },
      quest,
      targets: {
        a: [],
        candidates: [...words],
        lastTimeGenerated: Date.now(),
        speed: dif.targets.speed,
        cd: dif.targets.cd,
      },
      score: {
        health: dif.maxHealth,
        required: dif.successCountPerWord * words.length, total: 0,
        requiredPerWord: dif.successCountPerWord,
        perWord: words.reduce((prev, word) => { prev[word.name] = 0; return prev; }, {}),
      },
      prepared: prepare(is),
    },
    gui: {
      assets,
      mouse: { x: -1, y: -1 },
      accelerationKB: false,  accelerationMouse: false,
      prepared: prepareDraw(is, quest.word.name),
    },
    lastTick: 0,
  };
  mergeDeep(state, optional);
  
  // render
  const render = () => {
    state.lastTick = Date.now();
    if (state.gameplay.score.loseTime) {
      if (state.gameplay.score.loseTime + is.dropGame.loseTime > state.lastTick) {
        calcNextLoseFrame(is, state);
        drawFrame(is, state);
      } else {
        gameEnder(0);
      }
    } else if (state.gameplay.score.wonTime) {
      if (state.gameplay.score.wonTime + is.dropGame.winTime > state.lastTick) {
        calcNextWonFrame(is, state);
        drawFrame(is, state);
      } else {
        gameEnder(state.gameplay.score.health);
      }
    } else {
      calcNextFrame(is, state); 
      calcGameplay(is, state); 
      drawFrame(is, state);
    }
  };
  const timer = setInterval(render, 1000 / is.dropGame.fps);
  // size change
  const resizeObserver = new ResizeObserver(() => {
    // change targets
    const {gameX: oldX, gameWidth: oldWidth } = is.prepared;
    is.prepared = prepareGui(is.ctx);
    const {gameX: newX, gameWidth: newWidth } = is.prepared;
    state.gameplay.targets.a.forEach((target) => {
      const coef = (target.x - oldX) / oldWidth;
      target.x = newX + (coef * newWidth);
    });
    // change hero
    {
      const coef = (state.gameplay.hero.x - oldX) / oldWidth;
      state.gameplay.hero.x = newX + (coef * newWidth);
    }
    // change mouse
    {
      const coef = (state.gui.mouse.x - oldX) / oldWidth;
      state.gui.mouse.x = newX + (coef * newWidth);
    }
    // change others 
    state.gui.prepared = prepareDraw(is, state.gameplay.quest.word.name);
    state.gameplay.prepared = prepare(is);
    drawBackground(is);
    render();
  });
  resizeObserver.observe(is.ctx.canvas);
  // promise magic
  let promiseResolve: (healthCount: number) => void;
  const promise = new Promise<number>((resolve) => promiseResolve = resolve);
  // game ender
  const gameEnder = (healthCount: number) => {
    resizeObserver.disconnect();
    clearInterval(timer);
    stopButton();
    stopMove();
    promiseResolve(healthCount);
  };
  return await promise;
}

export default drop;
