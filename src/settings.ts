
export const dropGame = {
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
      successCountPerWord: 3,
      maxHealth: 3,
      maxWordsTillQuest: 3,
    },
    normal: {
      targets: {
        speed: 5,
        cd: 1500,
      },
      successCountPerWord: 4,
      maxHealth: 2,
      maxWordsTillQuest: 4,
    },
    hard: {
      targets: {
        speed: 6,
        cd: 1200,
      },
      successCountPerWord: 5,
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
    maxWords: 12,
  }
}
export type DropGameDifficulty = typeof dropGame.difficulties.easy;

export const memoryGame = {
  winTime: 2500,
  margin: 15,
  recomendation: {
    minWords: 2,
    maxWords: 10,
  }
}

export const formGame = {
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
    maxWords: 12,
  }
}
export type FormGameDifficulty = typeof formGame.difficulties.learning;

export const viewerGame = {
  //margin: 12,
}

const colors = {
  questColorBG: "#cae58e",
  questColor1: "#b4e37d",
  questColor2: "#85e368",
  questColor3: "#5be14e",
  questColor4: "#23d653",
  success: "#2C5530",
  fail: "#E84855",
  questColorText: "#FEFA12",
  textColor: "#CF081F",
  button: {
    bg: "#ffffff",
    hover: "#d6d98b",
    pressed: "#c2c754",
    disabled: "#cccccc",
  },
  label: "#ffffff",
  bg: "#483C46",
  sky: "#87CEEB",
}

const fonts = {
  fontSize: 22,
  font: 'Verdana',
  ctxFont: `22px Verdana`,
}

const gui = {
  margin: 15,
  button: {
    rounding: 4,
    padding: 9,
    distance: fonts.fontSize,
  },
  scroll: {
    width: 15,
    padding: 8,
    timeout: 1500,
  },
  icon: {
    width: 50,
    height: 50,
  },
  status: {
    height: 100,
  }
}

const dimensions = {
  desiredClientMinHeight: 500,
  desiredClientMinWidth: 500 * 1080/2400,
  widthToHeightRatio: 1080/2400,
  heigth: 900,
}

const calculate = {
  isMobile: (widthToHeightRatio: number) => widthToHeightRatio < 1,
  gameWidth: (isMobile: boolean) => isMobile ? 900 * 1080/2400 : 900,
  gameX: (ctx: CanvasRenderingContext2D, gameWidth: number) => (ctx.canvas.width - gameWidth) / 2,
  gameXMax: (ctx: CanvasRenderingContext2D, gameWidth: number) => (ctx.canvas.width + gameWidth) / 2,
  toCanvasCoords: (ctx: CanvasRenderingContext2D, x: number, y: number): [ number, number ] => [x * (ctx.canvas.width / ctx.canvas.clientWidth), y * (ctx.canvas.height / ctx.canvas.clientHeight)],
}

const localStorage = {
  progress: "elgame",
  scroll: "elgame-scroll",
}

const settings = {
  calculate,
  colors, 
  fonts,
  dimensions,
  gui,
  localStorage,
}

export type Settings = typeof settings;

export default settings;
