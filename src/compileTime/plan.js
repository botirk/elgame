import wordsJSON from "../compileTime/generated/words.json";

import { dropGame, formGame, memoryGame } from "../settings";

const plan = [
  {
    game: "form",
    label: "Learn first words",
    dif: formGame.difficulties.learning,
    words: Object.keys(wordsJSON),
  },
  {
    game: "memory",
    label: "Memorize first words",
    dif: undefined,
    words: Object.keys(wordsJSON),
  },
  {
    game: "drop",
    label: "More speed",
    dif: dropGame.difficulties.easy,
    words: Object.keys(wordsJSON),
  }
]

export default plan;