import fruitsJSON from "../../compileTime/generated/fruits.json";
import gameJSON from "../../compileTime/generated/game.json";

import { DropGameDifficulty } from "../../settings";
import drawBackground from "../../gui/background";
import { drawFrame } from "./draw";
import { loadImgs, LoadedImg, randomLoadedImg, TransformedImgsJSON } from "../../compileTime/generated";
import { calcTextWidth } from "../../gui/text";
import { InitSettings } from "../..";

const generateTarget = (is: InitSettings, words: LoadedImg[], prevWord?: LoadedImg) => {
  const x = is.calculated.clickableGameX + Math.random() * is.calculated.clickableGameWidth, y = 1000;
  let wordsAvailable = words;
  if (wordsAvailable.length > 1 && prevWord) {
    wordsAvailable = wordsAvailable.filter((word) => word != prevWord);
  }
  return { word: randomLoadedImg(wordsAvailable), x, y, timeGenerated: Date.now() };
}

const generateQuest = (is: InitSettings, words: LoadedImg[], state?: DropState) => {
  is.ctx.font = is.fonts.ctxFont;
  let wordsAvailable = words;
  if (state) {
    const remaining = state.words.filter((word) => state.successCount[word.name] < state.requiredSuccessCountPerWord);
    if (remaining.length == 1) {
      wordsAvailable = remaining;
    } else if (remaining.length > 0) {
      wordsAvailable = remaining.filter((word) => word != state.quest.word);
    }
  }
  const word = randomLoadedImg(wordsAvailable)
  const textX = is.calculated.gameX + (is.calculated.gameWidth - calcTextWidth(is, word.name)) / 2;
  return { word, textX };
}

const calcGameplay = (is: InitSettings, state: DropState) => {
  state.targets.forEach((target, i) => {
    const isMiss = (target.y < is.dropGame.progressBarY - target.word.img.height);
    const isHit = (Math.abs(state.heroX - target.x) <= is.hero.width) && (Math.abs(state.heroY - target.y) <= is.hero.height);
    const isQuest = (target.word == state.quest.word);
    if (isHit && isQuest) {
      if (state.successCount[state.quest.word.name] < state.requiredSuccessCountPerWord) {
        state.successCount[state.quest.word.name] += 1;
        state.currentSuccessCount += 1;
      }
      if (state.currentSuccessCount == state.requiredSuccessCount) {
        state.wonTime = Date.now();
      } else {
        state.quest = generateQuest(is, state.words, state);
      }
    } else if ((isMiss && isQuest) || (isHit && !isQuest)) {
      state.health = state.health - 1;
      if (state.health == 0) {
        state.loseTime = Date.now();
      }
    }
    if (isHit || isMiss) {
      const prevWord = state.targets.splice(i, 1)[0].word;
      state.targets.push(generateTarget(is, state.words, prevWord));
    }
  });
}

const calcNextFrame = (is: InitSettings, state: DropState) => {
  if (state.mouseX > -1) {
    if (state.heroX > state.mouseX) state.heroX = Math.max(state.heroX - state.speed, state.mouseX); else state.heroX = Math.min(state.heroX + state.speed, state.mouseX - is.hero.width / 2);
    state.heroX = Math.max(is.calculated.gameX, Math.min(is.calculated.clickableGameXMax, state.heroX));
  }
  let speed = is.dropGame.speed;
  if (state.accelerationKB || state.accelerationMouse) speed *= is.dropGame.acceleration;
  state.targets.forEach((target) => target.y -= speed);
}

const calcNextLoseFrame = (is: InitSettings, state: DropState) => {
  // move & remove
  let speed = is.dropGame.movieSpeed;
  state.targets.forEach((target, i) => {
    if (target.y < is.dropGame.progressBarY - target.word.img.height) state.targets.splice(i, 1);
    else target.y -= speed;
  });
  // generate new
  if (Date.now() - (state.targets.at(-1)?.timeGenerated || 0) > 150) {
    let target = generateTarget(is, state.words);
    for (let i = 0; i < 10 && Math.abs(target.x - state.heroX) < is.hero.width * 2; i++)  
      target.x = is.calculated.gameX * Math.random() * is.calculated.clickableGameWidth;
    state.targets.push(target);
  } 
}

const calcNextWonFrame = (is: InitSettings, state: DropState) => {
  // move & remove
  let speed = is.dropGame.movieSpeed;
  state.targets.forEach((target, i) => {
    // remove
    const isHit = (Math.abs(state.heroX - target.x) <= is.hero.width) && (Math.abs(state.heroY - target.y) <= is.hero.height);
    if (isHit) {
      state.targets.splice(i, 1);
      return;
    }
    // x move
    if (target.y < state.heroY + is.hero.height * 4) {
      if (target.x > state.heroX) {
        target.x = Math.max(state.heroX, target.x - speed);
      } else {
        target.x = Math.min(state.heroX, target.x + speed);
      }
    }
    // y move
    if (target.y > state.heroY) {
      target.y = Math.max(state.heroY, target.y - speed);
    }
  });
  // generate new
  if (Date.now() - (state.targets.at(-1)?.timeGenerated || 0) > 150) {
    const target = generateTarget(is, state.words);
    state.targets.push(target);
  }
}

export interface DropState {
  health: number,
  words: LoadedImg[],
  assets: TransformedImgsJSON<typeof gameJSON>,
  currentSuccessCount: number, requiredSuccessCount: number, requiredSuccessCountPerWord: number,
  successCount: { [word: string]: number },
  mouseX: number, mouseY: number,
  heroX: number, heroY: number,
  maxXHero: number, maxXTarget: number,
  progressBarTextsY: number,
  quest: { word: LoadedImg, textX: number },
  prevQuest?: DropState["quest"],
  targets: { word: LoadedImg, x: number, y: number, timeGenerated: number }[],
  speed: number,
  accelerationMouse: boolean, accelerationKB: boolean,
  wonTime?: number, loseTime?: number,
}

const drop = (is: InitSettings, dif: DropGameDifficulty, optional?: Partial<DropState>) => {
  drawBackground(is);

  const words = loadImgs(fruitsJSON, is.hero.width, "width");
  const stopMove = is.addMoveRequest((x, y) => {
    state.mouseX = x, state.mouseY = y;
    state.accelerationMouse = (y >= is.dropGame.accelerationY);
  });
  const stopButton = is.addButtonRequest({
    button: " ", 
    onReleased: () => state.accelerationKB = false,
    onPressed: () => state.accelerationKB = true,
  });
  // general state
  const state: DropState = {
    health: dif.maxHealth,
    words, assets: loadImgs(gameJSON, is.hero.width, "width"),
    requiredSuccessCount: dif.successCountPerWord * words.length, currentSuccessCount: 0,
    requiredSuccessCountPerWord: dif.successCountPerWord,
    successCount: words.reduce((prev, word) => { prev[word.name] = 0; return prev; }, {}),
    mouseX: -1, mouseY: - 1,
    progressBarTextsY: (is.dropGame.progressBarY / 2 + is.fonts.fontSize / 2),
    heroX: is.calculated.gameX + is.calculated.gameWidth / 2, heroY: is.dropGame.heroY,
    maxXHero: is.calculated.gameXMax - is.hero.width, maxXTarget: is.calculated.gameXMax - is.hero.width,
    quest: generateQuest(is, words),
    targets: [generateTarget(is, words)],
    speed: is.dropGame.mouseSpeed * is.calculated.verticalSpeedMultiplier,
    accelerationKB: false,  accelerationMouse: false,
    ...optional,
  };
  // render
  const render = () => {
    if (state.loseTime) {
      if (state.loseTime + is.dropGame.loseTime > Date.now()) {
        calcNextLoseFrame(is, state);
        drawFrame(is, state);
      } else {
        gameEnder(0);
      }
    } else if (state.wonTime) {
      if (state.wonTime + is.dropGame.winTime > Date.now()) {
        calcNextWonFrame(is, state);
        drawFrame(is, state);
      } else {
        gameEnder(state.health);
      }
    } else {
      calcNextFrame(is, state); 
      calcGameplay(is, state); 
      drawFrame(is, state);
    }
  };
  const timer = setInterval(render, 1000 / is.dropGame.fps);
  // promise magic
  let promiseResolve: (healthCount: number) => void;
  const promise = new Promise<number>((resolve) => promiseResolve = resolve);
  // game ender
  const gameEnder = (healthCount: number) => {
    clearInterval(timer);
    stopButton();
    stopMove();
    promiseResolve(healthCount);
  };
  return promise;
}

export default drop;
