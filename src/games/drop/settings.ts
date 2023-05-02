
const endDif = 15;

const generateSetup = (difficulty: number) => {
  difficulty = Math.max(0, Math.min(endDif, difficulty));

  return {
    targets: {
      speed: (0.5 + difficulty * 0.0125),
      cd: 1500 - difficulty * 45,
    },
    successCountPerWord: difficulty === 0 ? 2 : difficulty === endDif ? 4 : 3,
    maxHealth: difficulty === endDif ? 2 : 3,
    maxWordsTillQuest: difficulty === endDif ? 5 : 4,
  };
}

export const movieSetup: DropGameSetup = {
  targets: {
    speed: 1.25,
    cd: 111,
  },
  successCountPerWord: Infinity,
  maxHealth: Infinity,
  maxWordsTillQuest: 50,
}

export const dropSettings = {
  acceleration: 1.85,
  mouseSpeed: 0.4, // per 0.001 second or 1 ms
  heroY: 150,
  accelerationButton: " ",
  endDif, generateSetup, movieSetup,
  winTime: 4000, loseTime: 3000,
  recomendation: {
    minWords: 3,
    maxWords: 10,
    goodWords: 5,
  }
}

export type DropGameSetup = ReturnType<typeof generateSetup>;