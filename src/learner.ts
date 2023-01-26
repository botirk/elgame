import { loadWords } from "./asset";
import { AbstractGame, UnloadedWord, Word, WordWithImage } from "./games";
import Form from "./games/form/game";
import { formSettings } from "./games/form/settings";
import Viewer from "./games/viewer/game";
import { Init } from "./init";
import settings from "./settings";
import { randomNInArray } from "./utils";

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

