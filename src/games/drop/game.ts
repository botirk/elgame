import { InitSettings } from "../../settings";
import drawBackground from "../../gui/background";
import drawFrame from "./draw";
import words, { randomWord, Word } from "../../data";

const generateTarget = (is: InitSettings, state?: DropState, prevWord?: Word) => {
  const x = is.calculated.gameX + Math.random() * (is.calculated.gameWidth - is.hero.width), y = 1000;
  if (state && state.currentSuccessCount < state.requiredSuccessCount && words.length > 1) {
    const wordsAvailable = words.filter((word) => word != prevWord && state.successCount[word.text] < state.requiredSuccessCountPerWord);
    return { word: wordsAvailable[Math.floor(Math.random() * wordsAvailable.length)], x, y };
  } else {
    return { word: randomWord(), x, y };
  }
}

const generateQuest = (is: InitSettings, state?: DropState) => {
  if (state) {
    const wordsAvailable = words.filter((word) => (words.length == 1 || word != state.quest) && state.successCount[word.text] < state.requiredSuccessCountPerWord);
    return wordsAvailable[Math.floor(Math.random() * wordsAvailable.length)];
  } else {
    let candidate = randomWord();
    return candidate;
  }
}

const calcGameplay = (is: InitSettings, state: DropState) => {
  state.targets.forEach((target, i) => {
    if (target.y < -state.targetHeight) {
      const prevWord = state.targets.splice(i, 1)[0].word;
      state.targets.push(generateTarget(is, state, prevWord));
    } else {
      const hit = (Math.abs(state.heroX - target.x) < is.hero.width) && (Math.abs(state.heroY - target.y) < is.hero.height);
      if (hit) {
        if (target.word == state.quest && state.successCount[state.quest.text] < state.requiredSuccessCountPerWord) {
          state.successCount[state.quest.text] += 1;
          state.currentSuccessCount += 1;
          if (state.currentSuccessCount < state.requiredSuccessCount) state.quest = generateQuest(is, state);
        }
        const prevWord = state.targets.splice(i, 1)[0].word;
        state.targets.push(generateTarget(is, state, prevWord));
      }
    }
  });
}

const calcNextFrame = (is: InitSettings, state: DropState) => {
  if (state.mouseX > -1) {
    if (state.heroX > state.mouseX) state.heroX = Math.max(state.heroX - state.speed, state.mouseX, is.calculated.gameX);
    else state.heroX = Math.min(state.heroX + state.speed, state.mouseX, state.maxXHero);
  }
  state.targets.forEach((target) => target.y -= is.dropGame.speed * state.acceleration);
}

export interface DropState {
  targetHeight: number, targetWidth: number, questX: number,
  heroX: number, heroY: number,
  mouseX: number,
  maxXHero: number, maxXTarget: number,
  quest: Word,
  targets: { word: Word, x: number, y: number }[],
  speed: number,
  acceleration: number,
  currentSuccessCount: number, requiredSuccessCount: number, requiredSuccessCountPerWord: number,
  successCount: { [word: string]: number },
}

const drop = (is: InitSettings, successCountPerWord: number) => {
  const state: DropState = {
    questX: is.calculated.gameX + is.calculated.gameWidth / 2 - is.hero.width / 2,
    targetHeight: is.hero.height, targetWidth: is.hero.width,
    heroX: is.calculated.gameX + is.calculated.gameWidth / 2, heroY: is.dropGame.heroY,
    maxXHero: is.calculated.gameXMax - is.hero.width, maxXTarget: is.calculated.gameXMax - is.hero.width,
    mouseX: -1,
    quest: generateQuest(is),
    targets: [generateTarget(is)],
    speed: is.dropGame.mouseSpeed * is.calculated.verticalSpeedMultiplier,
    acceleration: 1,
    requiredSuccessCountPerWord: successCountPerWord,
    requiredSuccessCount: successCountPerWord * words.length, currentSuccessCount: 0,
    successCount: words.reduce((prev, word) => { prev[word.text] = 0; return prev; }, {}),
  };

  drawBackground(is);
  setInterval(() => { calcNextFrame(is, state); calcGameplay(is, state); drawFrame(is, state); }, 1000 / is.dropGame.fps);
  is.ctx.canvas.addEventListener("mousemove", (e) => state.mouseX = e.x);
  document.addEventListener("keydown", (e) => { if (e.key == " ") state.acceleration = is.dropGame.accelration; });
  document.addEventListener("keyup", (e) => { if (e.key == " ") state.acceleration = 1; });
}

export default drop;

