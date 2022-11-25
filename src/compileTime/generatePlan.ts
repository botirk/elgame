import { Plan } from "../games";
import { dropGame, formGame, memoryGame } from "../settings";
import wordsJSON from "./generated/words.json";
import { writeFileSync } from "fs";
import { randomNInArray } from "../utils";

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

const devPlanner = (): Plan => {
  const words = Object.keys(wordsJSON);
  const plan = init([...words]);
  {
    const minWords = randomNInArray(words, formGame.recomendation.minWords);
    const maxWords = randomNInArray(words, formGame.recomendation.maxWords);
    plan.form.push({
      place: 2,
      openPlace: [3],
      label: `Рек. мин.(${minWords.length}/${formGame.recomendation.minWords})`,
      difficulty: formGame.difficulties.learning,
      words: minWords,
    });
    plan.form.push({
      place: 3,
      openPlace: [4],
      label: `Рек. макс.(${maxWords.length}/${formGame.recomendation.maxWords})`,
      difficulty: formGame.difficulties.learning,
      words: maxWords,
    });
  }
  {
    const minWords = randomNInArray(words, memoryGame.recomendation.minWords);
    const maxWords = randomNInArray(words, memoryGame.recomendation.maxWords);
    plan.memory.push({
      place: 4,
      openPlace: [5],
      label: `Рек. мин.(${minWords.length}/${memoryGame.recomendation.minWords})`,
      words: minWords,
    });
    plan.memory.push({
      place: 5,
      openPlace: [6],
      label: `Рек. макс.(${maxWords.length}/${memoryGame.recomendation.maxWords})`,
      words: maxWords,
    });
  }
  {
    const minWords = randomNInArray(words, dropGame.recomendation.minWords);
    const maxWords = randomNInArray(words, dropGame.recomendation.maxWords);
    plan.drop.push({
      place: 6,
      openPlace: [7],
      label: `Easy Рек. мин.(${minWords.length}/${dropGame.recomendation.minWords})`,
      words: minWords,
      difficulty: dropGame.difficulties.easy,
    });
    plan.drop.push({
      place: 7,
      openPlace: [8],
      label: `Easy Рек. макс.(${maxWords.length}/${dropGame.recomendation.maxWords})`,
      words: maxWords,
      difficulty: dropGame.difficulties.easy,
    });
    plan.drop.push({
      place: 8,
      openPlace: [9],
      label: `Normal Рек. мин.(${minWords.length}/${dropGame.recomendation.minWords})`,
      words: minWords,
      difficulty: dropGame.difficulties.normal,
    });
    plan.drop.push({
      place: 9,
      openPlace: [10],
      label: `Normal Рек. макс.(${maxWords.length}/${dropGame.recomendation.maxWords})`,
      words: maxWords,
      difficulty: dropGame.difficulties.normal,
    });
    plan.drop.push({
      place: 10,
      openPlace: [12],
      label: `Hard Рек. мин.(${minWords.length}/${dropGame.recomendation.minWords})`,
      words: minWords,
      difficulty: dropGame.difficulties.hard,
    });
    plan.drop.push({
      place: 11,
      openPlace: [13],
      label: `Hard Рек. макс.(${maxWords.length}/${dropGame.recomendation.maxWords})`,
      words: maxWords,
      difficulty: dropGame.difficulties.hard,
    });
  }

  return plan;
}

export default (isDev?: boolean) => {
  writeFileSync(`${__dirname}/generated/plan.json`, JSON.stringify(isDev ? devPlanner() : betaPlanner()));
}