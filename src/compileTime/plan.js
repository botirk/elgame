import wordsJSON from "../compileTime/generated/words.json";

import { formGame } from "../settings"

const plan = [
  {
    game: "form",
    label: "learn first words",
    diff: formGame.difficulties.learning,
    words: Object.keys(wordsJSON),
  }
]

export default plan;