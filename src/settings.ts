import click from "./gui/click";
import hover from "./gui/hover"

const dropGame = {
  speed: 4,
  accelration: 2.2,
  mouseSpeed: 5.5,
  fps: 100,
  heroY: 150,
  questY: 100,
}

const colors = {
  textColor: "#CF081F",
  questColor: "#FEFA12",
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
  gameX: (ctx: CanvasRenderingContext2D, gameWidth: number) => ctx.canvas.width / 2 - gameWidth / 2,
  gameXMax: (ctx: CanvasRenderingContext2D, gameWidth: number) => ctx.canvas.width / 2 + gameWidth / 2,
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

export interface InitSettings extends Settings {
  ctx: CanvasRenderingContext2D,
  addHoverRequest: ReturnType<typeof hover>,
  addClickRequest: ReturnType<typeof click>,
  calculated: {
    isMobile: boolean,
    gameWidth: number,
    gameX: number, 
    gameXMax: number,
    verticalSpeedMultiplier: number,
  }
}

export default settings;
