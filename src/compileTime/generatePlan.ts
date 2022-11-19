import { Plan } from "../games";
import { dropGame, formGame } from "../settings";
import wordsJSON from "./generated/words.json";
import { writeFileSync } from "fs";

const init = (words: string[]): Plan => {
  return {
    viewer: [{
      place: 1,
      openPlace: [2],
      label: "Все слова",
      words,
    }],
    form: [],
    memory: [],
    drop: [],
  };
}

const pick10words = (words: string[]): string[] => {
  const result: string[] = [];
  for (let i = 0; i < 10; i++) {
    if (words.length == 0) break;
    const word = words.splice(Math.floor(Math.random() * words.length), 1)[0];
    result.push(word);
  }
  return result;
}

const betaPlanner = (): Plan => {
  const words = Object.keys(wordsJSON);
  const plan = init([...words]);
  const firstWords = pick10words(words);
  plan.form.push({
    place: 2,
    openPlace: [3],
    label: "Ознакомительное упражнение",
    difficulty: formGame.difficulties.learning,
    words: firstWords,
  });
  plan.memory.push({
    place: 3,
    openPlace: [4],
    label: "Запоминание",
    words: firstWords,
  });
  plan.drop.push({
    place: 4,
    openPlace: [],
    label: "Повторение",
    words: firstWords,
    difficulty: dropGame.difficulties.easy,
  });

  return plan;
}

export default () => {
  writeFileSync(`${__dirname}/generated/plan.json`, JSON.stringify(betaPlanner()));
}