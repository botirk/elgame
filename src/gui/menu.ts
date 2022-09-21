import { InitSettings } from "..";
import drop from "../games/drop/game";
import settings from "../settings";
import drawBackground from "./background";
import drawButton from "./button";

const drawMenu = (is: InitSettings) => {
  drawBackground(is);
  const stopAll = () => { stop1(true); stop2(true); stop3(true); };
  const stop1 = drawButton(is, async () => { 
    stopAll(); 
    const health = await drop(is, settings.dropGame.difficulties.easy);
    //alert(health);
    drawMenu(is);
  }, is.ctx.canvas.width / 2, 200, "Drop game", 135);
  const stop2 = drawButton(is, () => 0, is.ctx.canvas.width / 2, 200 + is.fonts.buttonDistance, "Not ready", 135);
  const stop3 = drawButton(is, () => 0, is.ctx.canvas.width / 2, 200 + is.fonts.buttonDistance * 2, "Not ready", 135);
}

export default drawMenu;
