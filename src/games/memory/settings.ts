
const endDif = 10;

const generateSetup = (difficulty: number, wordCount: number) => {
  difficulty = Math.max(0, Math.min(endDif, difficulty));
  return {
    health: difficulty === 0 ? Infinity : wordCount ** (2.5 - 0.125 * difficulty),
  }
}

export const memorySettings = {
  winTime: 3000,
  loseTime: 4000,
  margin: 15,
  generateSetup, endDif,
  recomendation: {
    minWords: 2,
    maxWords: 10,
    goodWords: 5,
  }
}

export type MemoryGameSetup = ReturnType<typeof generateSetup>;
