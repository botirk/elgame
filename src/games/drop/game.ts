import settings, { dropGame, DropGameDifficulty } from "../../settings";
import { drawFrame, Prepared as PreparedDraw, prepare as prepareDraw, prepareQuestX } from "./draw";
import { InitSettings } from "../..";
import { mergeDeep, promiseMagic, randomInArray, RecursivePartial } from "../../gui/utils";
import { reprepare as reprepareGui } from "../../gui/prepare";
import { drawFullscreenButton } from "../../gui/button";
import { WordWithImage } from "../word";
import { EndGameStats, Game } from "..";

const generateTarget = (is: InitSettings, state: DropState) => {
  const x = state.gameplay.prepared.clickableGameX + Math.random() * state.gameplay.prepared.clickableGameWidth, y = 1000;
  const word = randomInArray(state.gameplay.targets.candidates);
  if (state.gameplay.targets.candidates.length == 0 || (state.gameplay.targets.candidates.length == 1 && state.gameplay.words.length <= 2)) {
    state.gameplay.targets.candidates = [...state.gameplay.words];
  } else if (state.gameplay.targets.candidates.length == 1) {
    state.gameplay.targets.candidates = state.gameplay.words.filter((word) => word != state.gameplay.targets.candidates[0]);
  } else {
    state.gameplay.targets.candidates.splice(state.gameplay.targets.candidates.indexOf(word), 1);
  }
  return { word, x, y, timeGenerated: state.lastTick };
}

const generateQuest = (is: InitSettings, words: WordWithImage[], state?: DropState) => {
  is.ctx.font = settings.fonts.ctxFont;
  let wordsAvailable = words;
  if (state) {
    const remaining = state.gameplay.words.filter((word) => state.gameplay.score.perWord[word.toLearnText] < state.gameplay.score.requiredPerWord);
    if (remaining.length == 1) {
      wordsAvailable = remaining;
    } else if (remaining.length > 0) {
      wordsAvailable = remaining.filter((word) => word != state.gameplay.quest.word);
    }
  }
  const word = randomInArray(wordsAvailable);
  return { word, timeGenerated: state?.lastTick || Date.now() };
}

const calcGameplay = (is: InitSettings, state: DropState) => {
  state.gameplay.targets.a.forEach((target, i) => {
    const isMiss = (target.y < dropGame.progressBarY - target.word.toLearnImg.height);
    const isHit = (Math.abs(state.gameplay.hero.x - target.x) <= settings.hero.width) && (Math.abs(state.gameplay.hero.y - target.y) <= settings.hero.height);
    const isQuest = (target.word == state.gameplay.quest.word);
    if (isHit && isQuest) {
      if (state.gameplay.score.perWord[state.gameplay.quest.word.toLearnText] < state.gameplay.score.requiredPerWord) {
        state.gameplay.score.perWord[state.gameplay.quest.word.toLearnText] += 1;
        state.gameplay.score.total += 1;
        state.gameplay.score.lastScoreIncreasedTime = state.lastTick;
      }
      if (state.gameplay.score.total == state.gameplay.score.required) {
        state.gameplay.score.wonTime = state.lastTick;
      } else {
        state.gameplay.quest = generateQuest(is, state.gameplay.words, state);
        state.gui.prepared.questX = prepareQuestX(is, state.gameplay.quest.word.toLearnText);
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
  if (state.gui.mouse.x) {
    if (state.gameplay.hero.x > state.gui.mouse.x - settings.hero.width / 2)
      state.gameplay.hero.x = Math.max(state.gameplay.hero.x - state.gameplay.hero.speed, state.gui.mouse.x - settings.hero.width / 2); 
    else 
      state.gameplay.hero.x = Math.min(state.gameplay.hero.x + state.gameplay.hero.speed, state.gui.mouse.x- settings.hero.width / 2);
    // fix
    state.gameplay.hero.x = Math.max(is.prepared.gameX, Math.min(state.gameplay.prepared.clickableGameXMax, state.gameplay.hero.x));
  }
  let speed = state.gameplay.targets.speed;
  if (state.gui.accelerationKB || state.gui.accelerationMouse) speed *= dropGame.acceleration;
  state.gameplay.targets.a.forEach((target) => target.y -= speed);
}

const calcNextLoseFrame = (is: InitSettings, state: DropState) => {
  // move & remove
  let speed = dropGame.difficulties.movie.targets.speed;
  state.gameplay.targets.a.forEach((target, i) => {
    if (target.y < dropGame.progressBarY - target.word.toLearnImg.height) {
      state.gameplay.targets.a.splice(i, 1);
      state.gameplay.score.lastHealthLostTime = state.lastTick;
    } 
    else target.y -= speed;
  });
  // generate new
  if (state.gameplay.targets.a.length == 0 || state.lastTick - state.gameplay.targets.lastTimeGenerated >= dropGame.difficulties.movie.targets.cd) {
    let target = generateTarget(is, state);
    for (let i = 0; i < 10 && Math.abs(target.x - state.gameplay.hero.x) < settings.hero.width * 2; i++)
      target.x = is.prepared.gameX + Math.random() * state.gameplay.prepared.clickableGameWidth;
    state.gameplay.targets.a.push(target);
    state.gameplay.targets.lastTimeGenerated = state.lastTick;
  }
}

const calcNextWonFrame = (is: InitSettings, state: DropState) => {
  // move & remove
  state.gameplay.targets.a.forEach((target, i) => {
    const isHit = (Math.abs(state.gameplay.hero.x - target.x) <= settings.hero.width) && (Math.abs(state.gameplay.hero.y - target.y) <= settings.hero.height);
    if (isHit) {
      // remove
      state.gameplay.targets.a.splice(i, 1);
      state.gameplay.score.lastScoreIncreasedTime = state.lastTick;
      return;
    } else {
      // x move
      if (target.y < state.gameplay.hero.y + settings.hero.height * 4) {
        if (target.x > state.gameplay.hero.x) {
          target.x = Math.max(state.gameplay.hero.x, target.x - dropGame.difficulties.movie.targets.speed);
        } else {
          target.x = Math.min(state.gameplay.hero.x, target.x + dropGame.difficulties.movie.targets.speed);
        }
      }
      // y move
      if (target.y > state.gameplay.hero.y) {
        target.y = Math.max(state.gameplay.hero.y, target.y - dropGame.difficulties.movie.targets.speed);
      }
    }
  });
  // generate new
  if (state.gameplay.targets.a.length == 0 || state.lastTick - state.gameplay.targets.lastTimeGenerated >= dropGame.difficulties.movie.targets.cd) {
    state.gameplay.targets.a.push(generateTarget(is, state));
    state.gameplay.targets.lastTimeGenerated = state.lastTick;
  }
}

const prepare = (is: InitSettings) => {
  return {
    maxXHero: is.prepared.gameXMax - settings.hero.width, 
    maxXTarget: is.prepared.gameXMax - settings.hero.width,
    clickableGameX: (is.ctx.canvas.width - is.prepared.gameWidth) / 2 + settings.hero.width,
    clickableGameXMax: (is.ctx.canvas.width + is.prepared.gameWidth) / 2 - settings.hero.width,
    clickableGameWidth: is.prepared.gameWidth - settings.hero.width * 2,
  };
}
type Prepared = ReturnType<typeof prepare>;

export interface DropState {
  // gameplay
  gameplay: {
    direction?: "left" | "right",
    words: WordWithImage[],
    quest: { word: WordWithImage, timeGenerated: number },
    prevQuest?: DropState["gameplay"]["quest"],
    targets: {
      a: { word: WordWithImage, x: number, y: number, timeGenerated: number }[],
      candidates: WordWithImage[],
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
    mouse: { x?: number, y?: number },
    accelerationMouse: boolean, accelerationKB: boolean,
    prepared: PreparedDraw,
  }
  lastTick: number,
}

const drop = (is: InitSettings, words: WordWithImage[], dif: DropGameDifficulty, optional?: RecursivePartial<DropState>) => async () => {
  const stopMove = is.addMoveRequest((x, y) => {
    state.gui.mouse.x = x, state.gui.mouse.y = y;
    state.gui.accelerationMouse = (y <= dropGame.progressBarY);
  });
  const stopResize = is.addResizeRequest(() => {
    // change canvas size
    const {gameX: oldX, gameWidth: oldWidth } = is.prepared;
    is.prepared = { ...is.prepared, ...reprepareGui(is.ctx) };
    const {gameX: newX, gameWidth: newWidth } = is.prepared;
    // change targets
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
    if (state.gui.mouse.x) {
      const coef = (state.gui.mouse.x - oldX) / oldWidth;
      state.gui.mouse.x = newX + (coef * newWidth);
    }
    // recalculate
    state.gui.prepared = prepareDraw(is, state.gameplay.quest.word.toLearnText);
    state.gameplay.prepared = prepare(is);
    // move fs button
    buttonFS.update();
    // render
    render();
  });
  const stopButton = is.addButtonRequest({
    button: " ", 
    onReleased: () => state.gui.accelerationKB = false,
    onPressed: () => state.gui.accelerationKB = true,
  });
  const stopRight = is.addButtonRequest({
    button: "ArrowRight",
    onPressed: () => { state.gui.mouse.x = Infinity; },
    onReleased: () => { state.gui.mouse.x = undefined; },
  });
  const stopLeft = is.addButtonRequest({
    button: "ArrowLeft",
    onPressed: () => { state.gui.mouse.x = -Infinity; },
    onReleased: () => { state.gui.mouse.x = undefined; },
  });
  const buttonFS = drawFullscreenButton(is, () => render());

  // general state
  const quest = generateQuest(is, words);
  const state: DropState = mergeDeep({
    gameplay: {
      words,
      hero: { 
        x: is.prepared.gameX + is.prepared.gameWidth / 2, y: dropGame.heroY, 
        speed: dropGame.mouseSpeed * is.prepared.verticalSpeedMultiplier 
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
        perWord: words.reduce((prev, word) => { prev[word.toLearnText] = 0; return prev; }, {}),
      },
      prepared: prepare(is),
    },
    gui: {
      mouse: { x: -1, y: -1 },
      accelerationKB: false,  accelerationMouse: false,
      prepared: prepareDraw(is, quest.word.toLearnText),
    },
    lastTick: 0,
  }, optional);
  
  // render
  const render = () => {
    state.lastTick = Date.now();
    if (state.gameplay.score.loseTime) {
      if (state.gameplay.score.loseTime + dropGame.loseTime > state.lastTick) {
        calcNextLoseFrame(is, state);
        drawFrame(is, state);
        buttonFS.redraw();
      } else {
        gameEnder({ isSuccess: false });
      }
    } else if (state.gameplay.score.wonTime) {
      if (state.gameplay.score.wonTime + dropGame.winTime > state.lastTick) {
        calcNextWonFrame(is, state);
        drawFrame(is, state);
        buttonFS.redraw();
      } else {
        gameEnder({ isSuccess: true });
      }
    } else {
      calcNextFrame(is, state); 
      calcGameplay(is, state); 
      drawFrame(is, state);
      buttonFS.redraw();
    }
  };
  const timer = setInterval(render, 1000 / dropGame.fps);

  // promise
  const [promise, gameEnder] = promiseMagic<EndGameStats>(() => {
    clearInterval(timer);
    stopButton();
    stopRight();
    stopLeft();
    stopMove();
    stopResize();
    buttonFS.stop(false);
  });
  return await promise;
}

export default drop;
