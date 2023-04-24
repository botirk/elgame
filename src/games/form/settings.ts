
const recomendation = {
  minWords: 2,
  goodWords: 6,
  maxWords: 10,
}

const startLearnDif = 0;
const endLearnDif = 1;
const generateLearningSetup = (difficulty: number) =>  {
  return {
    startCount: 1,
    endCount: 2,
    stepCount: 1,
    maxHealth: 3,
  }
};

const generateSetup = (difficulty: number) => {
  return {
    startCount: 2,
    endCount: 3,
    stepCount: 1,
    maxHealth: 3,
  }
};

export const formSettings = {
  endAnimationTime: 3000,
  pause: 900,
  recomendation,
  generateLearningSetup, startLearnDif, endLearnDif,
  generateSetup,
}

export type FormGameSetup = ReturnType<typeof formSettings.generateSetup>;