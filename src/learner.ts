import { loadWords } from "./asset";
import { UnloadedWord, WordWithImage } from "./games";
import Form from "./games/form/game";
import { formSettings } from "./games/form/settings";
import { Init } from "./init";
import settings from "./settings";
import { randomNInArray } from "./utils";

export const suggestGame = (words: UnloadedWord[], init: Init) => {
  const name = "Анкета";
  const label = "Изучение пяти слов";
  const wordsSelected = randomNInArray(Object.values(words), 5);
  const game = async () => {
    return new Form(init, { words: await loadWords(wordsSelected, settings.gui.icon.width, "width") as WordWithImage[], dif: formSettings.difficulties.learning });
  };
  return { name, label, game };
}

