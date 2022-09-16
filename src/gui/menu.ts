import drop from "../games/drop/game";
import { InitSettings } from "../settings";
import drawBackground from "./background";
import drawButton from "./button";

const drawMenu = (is: InitSettings) => {
  drawBackground(is);
  const stopAll = () => { stop1(true); stop2(true); stop3(true); };
  const stop1 = drawButton(is, () => { stopAll(); drop(is, 3); }, is.ctx.canvas.width / 2, 200, "Drop game", 135);
  const stop2 = drawButton(is, stopAll, is.ctx.canvas.width / 2, 200 + is.fonts.buttonDistance, "Not ready", 135);
  const stop3 = drawButton(is, stopAll, is.ctx.canvas.width / 2, 200 + is.fonts.buttonDistance * 2, "Not ready", 135);
}

export default drawMenu;
