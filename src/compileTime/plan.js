import wordsJSON from "../compileTime/generated/words.json";

import { dropGame, formGame, memoryGame } from "../settings";

export const formPlan = [
  {
    place: 1,
    label: "Learn first words",
    dif: formGame.difficulties.learning,
    words: Object.keys(wordsJSON),
  },
];

export const memoryPlan = [
  {
    place: 2,
    label: "Memorize first words",
    dif: undefined,
    words: Object.keys(wordsJSON),
  },
];

export const dropPlan = [
  {
    place: 3,
    label: "More speed",
    dif: dropGame.difficulties.easy,
    words: Object.keys(wordsJSON),
  },
];
