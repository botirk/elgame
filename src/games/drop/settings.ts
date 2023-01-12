
export const settings = {
  acceleration: 1.85,
  mouseSpeed: 5.5,
  fps: 100,
  heroY: 150,
  accelerationButton: " ",
  difficulties: {
    easy: {
      targets: {
        speed: 4,
        cd: 2000,
      },
      successCountPerWord: 2,
      maxHealth: 3,
      maxWordsTillQuest: 3,
    },
    normal: {
      targets: {
        speed: 5,
        cd: 1500,
      },
      successCountPerWord: 3,
      maxHealth: 2,
      maxWordsTillQuest: 4,
    },
    hard: {
      targets: {
        speed: 6,
        cd: 1200,
      },
      successCountPerWord: 4,
      maxHealth: 1,
      maxWordsTillQuest: 5,
    },
    movie: {
      targets: {
        speed: 15,
        cd: 111,
      },
      successCountPerWord: Infinity,
      maxHealth: Infinity,
      maxWordsTillQuest: 50,
    }
  },
  winTime: 4000, loseTime: 3000,
  recomendation: {
    minWords: 3,
    maxWords: 10,
  }
}

export type DropGameDifficulty = typeof settings.difficulties.easy;