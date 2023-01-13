
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
