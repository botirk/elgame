import { loadWords } from "./asset";
import { AbstractGame, UnloadedWord, Word, WordWithImage } from "./games";
import Form from "./games/form/game";
import { formSettings } from "./games/form/settings";
import Viewer from "./games/viewer/game";
import { Init } from "./init";
import settings from "./settings";
import { randomNInArray } from "./utils";

interface WordProgress {
  [word: string]: {
    // second > five seconds > 25 seconds > 125 seconds > 625 seconds > ...
    stage: number;
    // 0 to 3, 4 is completion
    substage: number;
    // time stage achieved
    timestamp: Date;
    // words mistaken [word, number of times mistaken].length <= 10
    mistakes: [string, number][];
  }
}

let progressCache: WordProgress | undefined;
export const loadProgress = () => {
  if (progressCache) return progressCache;
  progressCache = {};
  const str = localStorage.getItem("elgame");
  if (!str) return progressCache;
  try {
    const parsed = JSON.parse(str);
    if (typeof(parsed) !== "object") return progressCache;
    for (const key in parsed) {
      progressCache[key] = { stage: 0, substage: 0, timestamp: new Date(), mistakes: [] };
      const candidate = parsed[key];
      if (typeof(candidate) !== "object") continue;
      if (typeof(candidate.stage) === "number" && candidate.stage >= 0) progressCache[key].stage = candidate.stage;
      if (typeof(candidate.substage) === "number" && candidate.substage >= 0) progressCache[key].substage = candidate.substage;
      if (typeof(candidate.timestamp) === "string") {
        const date = new Date(candidate.timestamp);
        if (isFinite(+date)) progressCache[key].timestamp = date;
      }
      if (candidate.mistakes instanceof Array) {
        for (let i = 0; i < 10 && i < candidate.mistakes.length; i++) {
          if (candidate.mistakes[i] instanceof Array) {
            if (typeof(candidate.mistakes[i][0] === "string") && typeof(candidate.mistakes[i][1] === "number")) {
              progressCache[key].mistakes[i] = [candidate.mistakes[i][0], candidate.mistakes[i][1]];
            }
          }
        }
      }
    }
  } finally {
    return progressCache;
  }
}

export const suggestGame = (init: Init, words: UnloadedWord[]) => {
  const name = "Анкета";
  const label = "Изучение пяти слов";
  const wordsSelected = randomNInArray(words, 5);
  const game = async () => {
    return new Form(init, { words: await loadWords(wordsSelected, settings.gui.icon.width, "width") as WordWithImage[], dif: formSettings.difficulties.learning });
  };
  const viewer = async () => {
    return new Viewer(init, await loadWords(wordsSelected, settings.gui.icon.width, "width"));
  };
  return { name, label, game, viewer };
}

export const saveProgressSuccess = (successWord: Word, partnerWords: Word[]) => {

}

export const saveProgressFail = (successWord: Word, failWord: Word, partnerWords: Word[]) => {

}

export const saveProgress = (game: AbstractGame<any, any, any, any>) => {
  game.onProgressSuccess = saveProgressSuccess;
  game.onProgressFail = saveProgressFail;
}

