
const dropGame = {
  speed: 4,
  acceleration: 2.1,
  mouseSpeed: 5.5,
  fps: 100,
  heroY: 150,
  progressBarY: 100,
  accelerationY: 675,
  accelerationButton: " ",
  difficulties: {
    easy: {
      successCountPerWord: 3,
      maxHealth: 3,
    },
    normal: {
      successCountPerWord: 4,
      maxHealth: 2,
    },
    hard: {
      successCountPerWord: 5,
      maxHealth: 1,
    }
  },
  winTime: 4000, loseTime: 3000, movieSpeed: 14,
}

export type DropGameDifficulty = typeof dropGame.difficulties.easy | typeof dropGame.difficulties.normal | typeof dropGame.difficulties.hard;

const colors = {
  questColorBG: "#cae58e",
  questColor1: "#b4e37d",
  questColor2: "#85e368",
  questColor3: "#5be14e",
  questColor4: "#23d653",
  questColorText: "#FEFA12",
  textColor: "#CF081F",
  buttonColor: "#ffffff",
  hoverColor: "#d6d98b",
  pressedColor: "#c2c754",
  labelColor: "#ffffff",
  bgColor: "#483C46",
  skyColor: "#87CEEB",
}

const fonts = {
  fontSize: 22,
  font: 'Georgia',
  additionalButtonHeight: 6,
  buttonDistance: 22 * 3,
  ctxFont: `22px Georgia`,
}

const dimensions = {
  desiredClientMinHeight: 500,
  desiredClientMinWidth: 500 * 1080/2400,
  widthToHeightRatio: 1080/2400,
  heigth: 900,
  isMobile: (widthToHeightRatio: number) => widthToHeightRatio < 1,
  gameWidth: (isMobile: boolean) => isMobile ? 900 * 1080/2400 : 900,
  gameX: (ctx: CanvasRenderingContext2D, gameWidth: number) => (ctx.canvas.width - gameWidth) / 2,
  gameXMax: (ctx: CanvasRenderingContext2D, gameWidth: number) => (ctx.canvas.width + gameWidth) / 2,
  clickableGameX: (ctx: CanvasRenderingContext2D, gameWidth: number) => (ctx.canvas.width - gameWidth) / 2 + settings.hero.width,
  clickableGameXMax: (ctx: CanvasRenderingContext2D, gameWidth: number) => (ctx.canvas.width + gameWidth) / 2 - settings.hero.width,
  clickableGameWidth: (ctx: CanvasRenderingContext2D, gameWidth: number) => gameWidth - settings.hero.width * 2,
  toCanvasCoords: (ctx: CanvasRenderingContext2D, x: number, y: number): [ number, number ] => [x * (ctx.canvas.width / ctx.canvas.clientWidth), y * (ctx.canvas.height / ctx.canvas.clientHeight)],
}

const hero = {
  width: 40,
  height: 40,
}

const settings = {
  colors, 
  fonts,
  dimensions,
  dropGame,
  hero,
}

export type Settings = typeof settings;

export default settings;
