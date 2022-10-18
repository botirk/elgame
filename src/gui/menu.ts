import { InitSettings } from "..";
import drop from "../games/drop/game";
import settings from "../settings";
import drawBackground from "./background";
import drawButton, { drawFullscreenButton } from "./button";
import { reprepare as reprepareGui } from "../gui/prepare";
import memory from "../games/memory/game";

const drawMenu = (is: InitSettings) => {
  drawBackground(is.ctx);
  // drop game
  const [stop1, redraw1] = drawButton(is, async () => { 
    stop();
    const health = await drop(is, settings.dropGame.difficulties.easy);
    //alert(health);
    drawMenu(is);
  }, is.ctx.canvas.width / 2, 200, "Drop game", 175);
  // memory game
  const [stop2, redraw2] = drawButton(is, async () => {
    stop();
    await memory(is);
    drawMenu(is);
  }, is.ctx.canvas.width / 2, 200 + settings.fonts.buttonDistance, "Memory game", 175);
  // undone
  const [stop3, redraw3] = drawButton(is, () => 0, is.ctx.canvas.width / 2, 200 + settings.fonts.buttonDistance * 2, "Not ready", 175);
  // redraw
  const redraw = () => { drawBackground(is.ctx); redraw1(); redraw2(); redraw3(); redrawFS(); }
  // fullscreen button
  const [stopFS, redrawFS, moveFS] = drawFullscreenButton(is, redraw);
  // observer
  const stopResize = is.addResizeRequest(() => {
    is.prepared = { ...is.prepared, ...reprepareGui(is.ctx) };
    redraw();
    moveFS();
    redrawFS();
  });
  // stopper
  const stop = () => { stop1(true); stop2(true); stop3(true); stopFS(false); stopResize(); };
  // ret
  return stop;
}

export default drawMenu;
