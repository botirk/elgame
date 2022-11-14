import wordsJSON from "../compileTime/generated/words.json";

import { dropGame, formGame, memoryGame } from "../settings";

export const viewerPlan = [
  {
    place: 1,
    label: "Слова для изучения",
    words: Object.keys(wordsJSON),
  }
];

export const formPlan = [
  {
    place: 2,
    label: "Анкета - ознакомтесь с первыми словами",
    dif: formGame.difficulties.learning,
    words: Object.keys(wordsJSON),
  },
];

export const memoryPlan = [
  {
    place: 3,
    label: "Карточки - запомните первые слова",
    dif: undefined,
    words: Object.keys(wordsJSON),
  },
];

export const dropPlan = [
  {
    place: 4,
    label: "Игра - на время",
    dif: dropGame.difficulties.easy,
    words: Object.keys(wordsJSON),
  },
];
