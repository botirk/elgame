import hover from "./gui/hover"

const settings = {
  textColor: "#EF6F6C",
  buttonColor: "#EFF0D1",
  hoverColor: "#d6d98b",
  bgColor: "#483C46",
  desiredMinHeight: 500,
  desiredMinWidth: 500,
  fontSize: 20,
  additionalButtonHeight: 20 / 2.5,
  font: 'serif',
}

export type Settings = typeof settings;

export interface InitSettings extends Settings {
  ctx: CanvasRenderingContext2D,
  addHoverRequest: ReturnType<typeof hover>,
  ctxFont: string,
}

export default settings;
