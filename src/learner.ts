import { loadWords } from "./asset";
import { AbstractGame, EndGameStats, GameName, UnloadedWord, Word, WordWithImage } from "./games";
import Drop from "./games/drop/game";
import { dropSettings } from "./games/drop/settings";
import Form from "./games/form/game";
import { formSettings } from "./games/form/settings";
import Memory from "./games/memory/game";
import { memorySettings } from "./games/memory/settings";
import Viewer from "./games/viewer/game";
import { Init } from "./init";
import settings from "./settings";
import { ru } from "./translation";

export interface WordProgress {
  // length <= 10
  prevGames: GameName[],
  words: {
    [word: string]: {
      // zero > second > five seconds > 25 seconds > 125 seconds > 625 seconds > ...
      stage: number;
      // 0 to 3, 4 is completion
      substage: number;
      // 0 to Infinity
      bonusstage: number;
      // time stage achieved
      timestamp: Date;
      // words mistaken [word, number of times mistaken].length <= 10
      mistakes: [string, number][];
      // success times
      success: number;
      // fail times
      fail: number;
    }
  }
}

let progressCache: WordProgress | undefined;
export const loadProgress = () => {
  if (progressCache) return progressCache;
  progressCache = {
    prevGames: [], 
    words: new Proxy<WordProgress["words"]>({}, {
      get: (target, p) => target[p.toString()] ||= { stage: 0, substage: 0, bonusstage: 0, timestamp: new Date(), mistakes: [], success: 0, fail: 0 },
    }),
  };
  const str = localStorage.getItem("elgame");
  if (!str) return progressCache;
  try {
    const parsed = JSON.parse(str);
    if (typeof(parsed) !== "object") return progressCache;
    if (!(parsed.prevGames instanceof Array)) return progressCache;
    for (const name of parsed.prevGames) {
      if (typeof(name) === "string") progressCache.prevGames.push(name as GameName);
    }
    if (typeof(parsed.words) !== "object") return progressCache;
    for (const key in parsed.words) {
      const candidate = parsed.words[key];
      if (typeof(candidate) !== "object") continue;
      if (typeof(candidate.stage) === "number" && candidate.stage >= 0) progressCache.words[key].stage = candidate.stage;
      if (typeof(candidate.substage) === "number" && candidate.substage >= 0) progressCache.words[key].substage = candidate.substage;
      if (typeof(candidate.bonusstage) === "number" && candidate.bonusstage >= 0) progressCache.words[key].bonusstage = candidate.bonusstage;
      if (typeof(candidate.success) === "number" && candidate.success >= 0) progressCache.words[key].success = candidate.success;
      if (typeof(candidate.fail) === "number" && candidate.fail >= 0) progressCache.words[key].fail = candidate.fail;
      if (typeof(candidate.timestamp) === "string") {
        const date = new Date(candidate.timestamp);
        if (isFinite(+date)) progressCache.words[key].timestamp = date;
      }
      if (candidate.mistakes instanceof Array) {
        for (let i = 0; i < 10 && i < candidate.mistakes.length; i++) {
          if (candidate.mistakes[i] instanceof Array) {
            if (typeof(candidate.mistakes[i][0] === "string") && typeof(candidate.mistakes[i][1] === "number")) {
              progressCache.words[key].mistakes[i] = [candidate.mistakes[i][0], candidate.mistakes[i][1]];
            }
          }
        }
      }
    }
  } finally {
    return progressCache;
  }
}

export const writeProgress = (progress: WordProgress) => {
  progressCache = progress;
  try {
    const parsed = JSON.stringify(progress);
    localStorage.setItem("elgame", parsed);
    return true;
  } catch {
    return false;
  }
}

export const stageTime = (stage: number) => {
 return 1000 * (5 ** Math.min(stage, 15));
}

export const isLearnedForNow = (word: UnloadedWord, progress: WordProgress = loadProgress(), now: Date = new Date()) => {
  const wordProgress = progress.words[word.toLearnText];
  return (now.getTime() - wordProgress.timestamp.getTime() < stageTime(wordProgress.stage));
}

export const nextLearnDate = (word: UnloadedWord, progress: WordProgress = loadProgress(), now: Date = new Date()) => {
  const wordProgress = progress.words[word.toLearnText];
  return new Date(wordProgress.timestamp.getTime() + stageTime(wordProgress.stage));
}

export const untilNextLearnDate = (word: UnloadedWord, progress: WordProgress = loadProgress(), now: Date = new Date()) => {
  const nextDate = nextLearnDate(word, progress, now);
  const diffMS = Math.abs(nextDate.getTime() - now.getTime());
  const diffDays = Math.floor(diffMS / (1000 * 60 * 60 * 24));
  const diffTime = new Date(diffMS % (1000 * 60 * 60 * 24));

  let result = "";
  if (diffDays > 0) result += `${diffDays}${ru.Day}`;
  result += `${diffTime.getHours()}:${diffTime.getMinutes()}:`;
  if (diffTime.getSeconds() < 10) result += '0';
  result += `${diffTime.getSeconds()}`
  return result;
}

export const suggestGame = (init: Init, words: UnloadedWord[]) => {
  const progress = loadProgress();
  const now = new Date();
  const allViewer = async () => {
    return new Viewer(init, { words: await loadWords(words, settings.gui.icon.width, "width"), progress });
  }
  words.sort((a, b) => {
    if (progress.words[a.toLearnText].stage === progress.words[b.toLearnText].stage) {
      const aLearned = isLearnedForNow(a, progress, now);
      const bLearned = isLearnedForNow(a, progress, now);
      if (bLearned && !aLearned) return -1;
      else if (!bLearned && aLearned) return 1;
      else if (aLearned && bLearned) return progress.words[a.toLearnText].bonusstage - progress.words[b.toLearnText].bonusstage;
      else return progress.words[b.toLearnText].substage - progress.words[a.toLearnText].substage;
    } else {
      return progress.words[a.toLearnText].stage - progress.words[b.toLearnText].stage;
    }
  });

  const shouldIntroduce = (progress.words[words[0].toLearnText].stage === 0);
  if (shouldIntroduce) {
    const wordsSelected = words.slice(0, formSettings.recomendation.goodWords);
    const name = ru.FormGame;
    const label = ru.Introduction;
    const game = async () => {
      return new Form(init, { words: await loadWords(wordsSelected, settings.gui.icon.width, "width") as WordWithImage[], dif: formSettings.difficulties.learning });
    };
    const viewer = async () => {
      return new Viewer(init, { words: await loadWords(wordsSelected, settings.gui.icon.width, "width"), progress });
    };
    return { name, label, game, viewer, allViewer };
  }

  const formCount = progress.prevGames.filter((name) => name === "form").length;
  const dropCount = progress.prevGames.filter((name) => name === "drop").length;
  const memoryCount = progress.prevGames.filter((name) => name === "memory").length;
  const shouldForm = (formCount <= dropCount && formCount <= memoryCount);
  if (false) { //shouldForm) {
    const wordsSelected = words.slice(0, formSettings.recomendation.goodWords);
    const name = ru.FormGame;
    const isBonus = !wordsSelected.some((word) => !isLearnedForNow(word, progress, now));
    const label = isBonus ? ru.Bonus :  ru.Repeat;
    const game = async () => {
      return new Form(init, { words: await loadWords(wordsSelected, settings.gui.icon.width, "width") as WordWithImage[], dif: formSettings.difficulties.medium });
    };
    const viewer = async () => {
      return new Viewer(init, { words: await loadWords(wordsSelected, settings.gui.icon.width, "width"), progress });
    };
    return { name, label, game, viewer, allViewer };
  }
  const shouldDrop = (dropCount <= formCount && dropCount <= memoryCount);
  if (false) { //shouldDrop) {
    const wordsSelected = words.slice(0, dropSettings.recomendation.goodWords);
    const name = ru.DropGame;
    const isBonus = !wordsSelected.some((word) => !isLearnedForNow(word, progress, now));
    const label = isBonus ? ru.Bonus :  ru.Repeat;
    const game = async () => {
      return new Drop(init, { words: await loadWords(wordsSelected, settings.gui.icon.width, "width") as WordWithImage[], dif: dropSettings.difficulties.normal });
    };
    const viewer = async () => {
      return new Viewer(init, { words: await loadWords(wordsSelected, settings.gui.icon.width, "width"), progress });
    };
    return { name, label, game, viewer, allViewer };
  }
  const shouldMemory = true;
  if (true) {
    const wordsSelected = words.slice(0,memorySettings.recomendation.goodWords);
    const name = ru.MemoryGame;
    const isBonus = !wordsSelected.some((word) => !isLearnedForNow(word, progress, now));
    const label = isBonus ? ru.Bonus :  ru.Repeat;
    const game = async () => {
      return new Memory(init, await loadWords(wordsSelected, settings.gui.icon.width, "width") as WordWithImage[]);
    };
    const viewer = async () => {
      return new Viewer(init, { words: await loadWords(wordsSelected, settings.gui.icon.width, "width"), progress });
    };
    return { name, label, game, viewer, allViewer };
  } 
}

export const saveProgressSuccess = (successWord: Word, partnerWords: Word[]) => {
  const progress = loadProgress();
  const now = new Date();
  // main word
  let wordProgress = progress.words[successWord.toLearnText];
  wordProgress.success += 1;
  if (!isLearnedForNow(successWord, progress, now)) {
    wordProgress.substage += 1;
    if (wordProgress.substage >= 4) {
      wordProgress.bonusstage = 0;
      wordProgress.substage = 0;
      wordProgress.stage += 1;
      wordProgress.timestamp = now;
    }
  } else {
    wordProgress.bonusstage += 1;
  }
  progress.words[successWord.toLearnText] = wordProgress;
  // partners
  for (const partnerWord of partnerWords) {
    wordProgress = progress.words[partnerWord.toLearnText];
    if (!isLearnedForNow(partnerWord, progress, now)) {
      wordProgress.substage += 0.1;
      if (wordProgress.substage >= 4) {
        wordProgress.substage = 0;
        wordProgress.bonusstage = 0;
        wordProgress.stage += 1;
        wordProgress.timestamp = now;
      }
    } else {
      wordProgress.bonusstage += 0.1;
    }
    progress.words[partnerWord.toLearnText] = wordProgress;
  }
  // write
  return writeProgress(progress);
}

export const saveProgressFail = (successWord: Word, failWord: Word, partnerWords: Word[]) => {
  const progress = loadProgress();
  // success word
  let wordProgress = progress.words[successWord.toLearnText];
  wordProgress.substage = Math.max(0, wordProgress.substage - 1);
  // find mistake
  const mistake = wordProgress.mistakes.find((mistake) => mistake[0] === failWord.toLearnText);
  // increment
  if (mistake) mistake[1] += 1;
  // push new mistake
  else if (wordProgress.mistakes.length < 10) wordProgress.mistakes.push([failWord.toLearnText, 1]);
  // replace old mistake with new mistake
  else {
    wordProgress.mistakes.sort((a, b) => b[1] - a[1]);
    wordProgress.mistakes[9] = [failWord.toLearnText, 1];
  }
  // save success
  progress.words[successWord.toLearnText] = wordProgress;
  // fail word
  wordProgress = progress.words[failWord.toLearnText];
  wordProgress.fail += 1;
  wordProgress.substage = Math.max(0, wordProgress.substage - 1);
  progress.words[failWord.toLearnText] = wordProgress;
  // write
  return writeProgress(progress);
}

export const saveProgressEnd = (stats: EndGameStats) => {
  if (!stats.name) return;
  const progress = loadProgress();
  while (progress.prevGames.length >= 10) progress.prevGames.shift();
  progress.prevGames.push(stats.name);
  return writeProgress(progress);
}

export const saveProgress = (game: AbstractGame<any, any, any, EndGameStats>) => {
  game.onProgressSuccess = saveProgressSuccess;
  game.onProgressFail = saveProgressFail;
  game.onGameEnd.then((stats) => { if (stats) saveProgressEnd(stats) });
}

