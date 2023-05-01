
const endDif = 13;

const generateSetup = (difficulty: number) => {
  return {
    targets: {
      speed: 5 + difficulty * 0.1,
      cd: 1500 - difficulty * 50,
    },
    successCountPerWord: difficulty === 0 ? 2 : difficulty === endDif ? 4 : 3,
    maxHealth: difficulty === endDif ? 2 : 3,
    maxWordsTillQuest: difficulty === endDif ? 5 : 4,
  };
}

export const movieSetup: DropGameSetup = {
  targets: {
    speed: 15,
    cd: 111,
  },
  successCountPerWord: Infinity,
  maxHealth: Infinity,
  maxWordsTillQuest: 50,
}

export const dropSettings = {
  acceleration: 1.85,
  mouseSpeed: 5.5,
  fps: 100,
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