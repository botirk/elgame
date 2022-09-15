import click from "./gui/click";
import hover from "./gui/hover"

const dropGame = {
  speed: 3.5,
  mouseSpeed: 5.5,
}

const colors = {
  textColor: "#EF6F6C",
  buttonColor: "#EFF0D1",
  hoverColor: "#d6d98b",
  pressedColor: "#c2c754",
  bgColor: "#483C46",
  skyColor: "#87CEEB",
}

const fonts = {
  fontSize: 20,
  font: 'serif',
  additionalButtonHeight: 5,
  buttonDistance: 20 * 3,
  ctxFont: `20px serif`
}

const dimensions = {
  desiredClientMinHeight: 500,
  desiredClientMinWidth: 500 * 1080/2400,
  widthToHeightRatio: 1080/2400,
  heigth: 900,
  isMobile: (widthToHeightRatio: number) => widthToHeightRatio < 1,
  gameWidth: (isMobile: boolean) => isMobile ? 900 * 1080/2400 : 900,
  gameXMin: (ctx: CanvasRenderingContext2D, gameWidth: number) => ctx.canvas.width / 2 - gameWidth / 2,
  gameXMax: (ctx: CanvasRenderingContext2D, gameWidth: number) => ctx.canvas.width / 2 + gameWidth / 2,
}

const settings = {
  colors, 
  fonts,
  dimensions,
  dropGame,
}

export type Settings = typeof settings;

export interface InitSettings extends Settings {
  ctx: CanvasRenderingContext2D,
  addHoverRequest: ReturnType<typeof hover>,
  addClickRequest: ReturnType<typeof click>,
  calculated: {
    isMobile: boolean,
    gameWidth: number,
    gameXMin: number, 
    gameXMax: number,
  }
}

export default settings;
