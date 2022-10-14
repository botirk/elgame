import fruitsJSON from "../../compileTime/generated/fruits.json";
import gameJSON from "../../compileTime/generated/game.json";

import { DropGameDifficulty } from "../../settings";
import { drawFrame } from "./draw";
import { loadImgs, LoadedImg, randomLoadedImg, TransformedImgsJSON } from "../../compileTime/generated";
import { calcTextWidth } from "../../gui/text";
import { InitSettings } from "../..";
import { mergeDeep, RecursivePartial } from "../../gui/utils";
import drawLoading from "../../gui/loading";

const generateTarget = (is: InitSettings, state: DropState) => {
  const x = is.calculated.clickableGameX + Math.random() * is.calculated.clickableGameWidth, y = 1000;
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
  const word = randomLoadedImg(wordsAvailable)
  const textX = is.calculated.gameX + (is.calculated.gameWidth - calcTextWidth(is, word.name)) / 2;
  return { word, textX, timeGenerated: state?.lastTick || Date.now() };
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
    if (state.gameplay.hero.x > state.gui.mouse.x) 
      state.gameplay.hero.x = Math.max(state.gameplay.hero.x - state.gameplay.hero.speed, state.gui.mouse.x); 
    else 
      state.gameplay.hero.x = Math.min(state.gameplay.hero.x + state.gameplay.hero.speed, state.gui.mouse.x);
    // fix
    state.gameplay.hero.x = Math.max(is.calculated.gameX, Math.min(is.calculated.clickableGameXMax, state.gameplay.hero.x));
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
      target.x = is.calculated.gameX + Math.random() * is.calculated.clickableGameWidth;
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

export interface DropState {
  // gameplay
  gameplay: {
    words: LoadedImg[],
    quest: { word: LoadedImg, textX: number, timeGenerated: number },
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
    }
  }
  // gui
  gui: {
    mouse: { x: number, y: number },
    progressBarTextsY: number,
    maxXHero: number, maxXTarget: number,
    accelerationMouse: boolean, accelerationKB: boolean,
    assets: TransformedImgsJSON<typeof gameJSON>,
  }
  lastTick: number,
}

const drop = async (is: InitSettings, dif: DropGameDifficulty, optional?: RecursivePartial<DropState>) => {
  drawLoading(is);
  const [words, assets] = await Promise.all([loadImgs(fruitsJSON, is.hero.width, "width"), loadImgs(gameJSON, is.hero.width, "width")]);

  const stopMove = is.addMoveRequest((x, y) => {
    state.gui.mouse.x = x, state.gui.mouse.y = y;
    state.gui.accelerationMouse = (y >= is.dropGame.accelerationY);
  });
  const stopButton = is.addButtonRequest({
    button: " ", 
    onReleased: () => state.gui.accelerationKB = false,
    onPressed: () => state.gui.accelerationKB = true,
  });
  // general state
  const state: DropState = {
    gameplay: {
      words,
      hero: { 
        x: is.calculated.gameX + is.calculated.gameWidth / 2, y: is.dropGame.heroY, 
        speed: is.dropGame.mouseSpeed * is.calculated.verticalSpeedMultiplier 
      },
      quest: generateQuest(is, words),
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
      }
    },
    gui: {
      assets,
      mouse: { x: -1, y: -1 },
      maxXHero: is.calculated.gameXMax - is.hero.width, maxXTarget: is.calculated.gameXMax - is.hero.width,
      accelerationKB: false,  accelerationMouse: false,
      progressBarTextsY: (is.dropGame.progressBarY / 2 + is.fonts.fontSize / 2),
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
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {

    }
  })
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
