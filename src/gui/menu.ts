import { InitSettings } from "..";
import drop from "../games/drop/game";
import settings from "../settings";
import drawBackground from "./background";
import drawButton, { drawFullscreenButton } from "./button";
import { reprepare as reprepareGui } from "../gui/prepare";

const drawMenu = (is: InitSettings) => {
  drawBackground(is.ctx);
  
  const [stop1, redraw1] = drawButton(is, async () => { 
    stop();
    const health = await drop(is, settings.dropGame.difficulties.easy);
    //alert(health);
    drawMenu(is);
  }, is.ctx.canvas.width / 2, 200, "Drop game", 135);
  const [stop2, redraw2] = drawButton(is, () => 0, is.ctx.canvas.width / 2, 200 + settings.fonts.buttonDistance, "Not ready", 135);
  const [stop3, redraw3] = drawButton(is, () => 0, is.ctx.canvas.width / 2, 200 + settings.fonts.buttonDistance * 2, "Not ready", 135);
  const redraw = () => { drawBackground(is.ctx); redraw1(); redraw2(); redraw3(); }
  const stop = () => { stop1(true); stop2(true); stop3(true); stopFS(false); };
  // observer
  const resizeObserver = new ResizeObserver(() => {
    is.prepared = { ...is.prepared, ...reprepareGui(is.ctx) };
    redraw();
    moveFS();
    redrawFS();
  });
  resizeObserver.observe(is.ctx.canvas);
  //alert("DRAWFSB")
  const [stopFS, redrawFS, moveFS] = drawFullscreenButton(is, redraw);
}

export default drawMenu;
