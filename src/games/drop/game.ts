import settings, { dropGame, DropGameDifficulty } from "../../settings";
import { drawFrame, Prepared as PreparedDraw, prepare as prepareDraw, prepareQuestX } from "./draw";
import { Init } from "../../init";
import { mergeDeep, promiseMagic, randomInArray, RecursivePartial } from "../../gui/utils";
import { reprepareInit } from "../../init";
import { drawFullscreenButton } from "../../gui/button";
import { WordWithImage } from "..";
import { EndGameStats, Game } from "..";

const generateTarget = (init: Init, state: DropState) => {
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

const generateQuest = (init: Init, words: WordWithImage[], state?: DropState) => {
  init.ctx.font = settings.fonts.ctxFont;
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

const calcGameplay = (init: Init, state: DropState) => {
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
        state.gameplay.targets.nextGeneration = dropGame.difficulties.movie.targets.cd;
        state.gameplay.score.wonTime = state.lastTick;
      } else {
        state.gameplay.quest = generateQuest(init, state.gameplay.words, state);
        state.gui.prepared.questX = prepareQuestX(init, state.gameplay.quest.word.toLearnText);
      }
    } else if ((isMiss && isQuest) || (isHit && !isQuest)) {
      state.gameplay.score.health = state.gameplay.score.health - 1;
      state.gameplay.score.lastHealthLostTime = state.lastTick;
      if (state.gameplay.score.health == 0) {
        state.gameplay.targets.nextGeneration = dropGame.difficulties.movie.targets.cd;
        state.gameplay.score.loseTime = state.lastTick;
      }
    }
    if (isHit || isMiss) state.gameplay.targets.a.splice(i, 1);
  });
  // generate new
  if (state.gameplay.targets.nextGeneration <= 0) {
    state.gameplay.targets.a.push(generateTarget(init, state));
    state.gameplay.targets.nextGeneration = state.gameplay.targets.cd;
  }
}

const calcNextFrame = (init: Init, state: DropState) => {
  if (state.gui.mouse.x) {
    if (state.gameplay.hero.x > state.gui.mouse.x - settings.hero.width / 2)
      state.gameplay.hero.x = Math.max(state.gameplay.hero.x - state.gameplay.hero.speed, state.gui.mouse.x - settings.hero.width / 2); 
    else 
      state.gameplay.hero.x = Math.min(state.gameplay.hero.x + state.gameplay.hero.speed, state.gui.mouse.x- settings.hero.width / 2);
    // fix
    state.gameplay.hero.x = Math.max(init.prepared.gameX, Math.min(state.gameplay.prepared.clickableGameXMax, state.gameplay.hero.x));
  }
  let speed = state.gameplay.targets.speed;
  let betaTime = 1000 / dropGame.fps;
  if (state.gui.accelerationKB || state.gui.accelerationMouse) {
    speed *= dropGame.acceleration;
    betaTime *= dropGame.acceleration;
  } 
  state.gameplay.targets.a.forEach((target) => target.y -= speed);
  state.gameplay.targets.nextGeneration -= betaTime;
}

const calcNextLoseFrame = (init: Init, state: DropState) => {
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
  if (state.gameplay.targets.nextGeneration <= 0) {
    let target = generateTarget(init, state);
    for (let i = 0; i < 10 && Math.abs(target.x - state.gameplay.hero.x) < settings.hero.width * 2; i++)
      target.x = init.prepared.gameX + Math.random() * state.gameplay.prepared.clickableGameWidth;
    state.gameplay.targets.a.push(target);
    state.gameplay.targets.nextGeneration = dropGame.difficulties.movie.targets.cd;
  } else {
    state.gameplay.targets.nextGeneration -= 1000 / dropGame.fps;
  }
}

const calcNextWonFrame = (init: Init, state: DropState) => {
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
  if (state.gameplay.targets.nextGeneration <= 0) {
    state.gameplay.targets.a.push(generateTarget(init, state));
    state.gameplay.targets.nextGeneration = dropGame.difficulties.movie.targets.cd;
  } else {
    state.gameplay.targets.nextGeneration -= 1000 / dropGame.fps;
  }
}

const prepare = (init: Init) => {
  return {
    maxXHero: init.prepared.gameXMax - settings.hero.width, 
    maxXTarget: init.prepared.gameXMax - settings.hero.width,
    clickableGameX: (init.ctx.canvas.width - init.prepared.gameWidth) / 2 + settings.hero.width,
    clickableGameXMax: (init.ctx.canvas.width + init.prepared.gameWidth) / 2 - settings.hero.width,
    clickableGameWidth: init.prepared.gameWidth - settings.hero.width * 2,
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
      nextGeneration: number,
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

const drop = (init: Init, words: WordWithImage[], dif: DropGameDifficulty, optional?: RecursivePartial<DropState>) => async () => {
  const stopMove = init.addMoveRequest((x, y) => {
    state.gui.mouse.x = x, state.gui.mouse.y = y;
    state.gui.accelerationMouse = (y <= dropGame.progressBarY);
  });
  const stopResize = init.addResizeRequest(() => {
    // change canvas size
    const {gameX: oldX, gameWidth: oldWidth } = init.prepared;
    init.prepared = reprepareInit(init);
    const {gameX: newX, gameWidth: newWidth } = init.prepared;
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
    state.gui.prepared = prepareDraw(init, state.gameplay.quest.word.toLearnText);
    state.gameplay.prepared = prepare(init);
    // move fs button
    buttonFS.update();
    // render
    render();
  });
  const stopButton = init.addButtonRequest({
    button: " ", 
    onReleased: () => state.gui.accelerationKB = false,
    onPressed: () => state.gui.accelerationKB = true,
  });
  const stopRight = init.addButtonRequest({
    button: "ArrowRight",
    onPressed: () => { state.gui.mouse.x = Infinity; },
    onReleased: () => { state.gui.mouse.x = undefined; },
  });
  const stopLeft = init.addButtonRequest({
    button: "ArrowLeft",
    onPressed: () => { state.gui.mouse.x = -Infinity; },
    onReleased: () => { state.gui.mouse.x = undefined; },
  });
  const buttonFS = drawFullscreenButton(init, () => render());

  // general state
  const quest = generateQuest(init, words);
  const state: DropState = mergeDeep({
    gameplay: {
      words,
      hero: { 
        x: init.prepared.gameX + init.prepared.gameWidth / 2, y: dropGame.heroY, 
        speed: dropGame.mouseSpeed * init.prepared.verticalSpeedMultiplier 
      },
      quest,
      targets: {
        a: [],
        candidates: [...words],
        nextGeneration: 0,
        speed: dif.targets.speed,
        cd: dif.targets.cd,
      },
      score: {
        health: dif.maxHealth,
        required: dif.successCountPerWord * words.length, total: 0,
        requiredPerWord: dif.successCountPerWord,
        perWord: words.reduce((prev, word) => { prev[word.toLearnText] = 0; return prev; }, {}),
      },
      prepared: prepare(init),
    },
    gui: {
      mouse: { x: -1, y: -1 },
      accelerationKB: false,  accelerationMouse: false,
      prepared: prepareDraw(init, quest.word.toLearnText),
    },
    lastTick: 0,
  }, optional);
  
  // render
  const render = () => {
    state.lastTick = Date.now();
    if (state.gameplay.score.loseTime) {
      if (state.gameplay.score.loseTime + dropGame.loseTime > state.lastTick) {
        calcNextLoseFrame(init, state);
        drawFrame(init, state);
        buttonFS.redraw();
      } else {
        gameEnder({ isSuccess: false });
      }
    } else if (state.gameplay.score.wonTime) {
      if (state.gameplay.score.wonTime + dropGame.winTime > state.lastTick) {
        calcNextWonFrame(init, state);
        drawFrame(init, state);
        buttonFS.redraw();
      } else {
        gameEnder({ isSuccess: true });
      }
    } else {
      calcNextFrame(init, state); 
      calcGameplay(init, state); 
      drawFrame(init, state);
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
