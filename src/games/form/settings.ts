
export const formSettings = {
  endAnimationTime: 3000,
  pause: 900,
  difficulties: {
    learning: {
      startCount: 1,
      endCount: 2,
      stepCount: 1,
      maxHealth: 3,
    },
    medium: {
      startCount: 2,
      endCount: 3,
      stepCount: 1,
      maxHealth: 3,
    }
  },
  recomendation: {
    minWords: 2,
    goodWords: 6,
    maxWords: 10,
  }
}

export type FormGameDifficulty = typeof formSettings.difficulties.learning;