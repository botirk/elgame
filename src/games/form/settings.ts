
const recomendation = {
  minWords: 2,
  goodWords: 6,
  maxWords: 10,
}

const endDif = 13;

const generateGenericSetup = (difficulty: number) =>  {
  difficulty = Math.max(0, Math.min(endDif, difficulty));

  let maxTime: number | undefined;
  if (difficulty > 0) maxTime = Math.max(2, 7500 - difficulty * 500);
  return { stepCount: 1, maxHealth: difficulty === endDif ? 2 : 3, maxTime };
}

const generateLearningSetup = (difficulty: number) =>  {
  return { ...generateGenericSetup(difficulty), startCount: 1, endCount: 2 }
};

const generateSetup = (difficulty: number) => {
  return { ...generateGenericSetup(difficulty), startCount: 2, endCount: 3 }
};

export const formSettings = {
  endAnimationTime: 3000,
  pause: 900,
  recomendation,
  generateLearningSetup, 
  endDif,
  generateSetup,
}

export type FormGameSetup = ReturnType<typeof formSettings.generateSetup>;