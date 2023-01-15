
export const formSettings = {
  endAnimationTime: 3000,
  pause: 900,
  difficulties: {
    learning: {
      startCount: 1,
      endCount: 2,
      stepCount: 1,
      maxHealth: 3,
    }
  },
  recomendation: {
    minWords: 2,
    maxWords: 10,
  }
}

export type FormGameDifficulty = typeof formSettings.difficulties.learning;