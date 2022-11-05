import { InitSettings } from "..";
import drop from "../games/drop/game";
import settings, { dropGame, formGame } from "../settings";
import drawBackground from "./background";
import drawButton, { drawFullscreenButton } from "./button";
import { reprepare as reprepareGui } from "../gui/prepare";
import memory from "../games/memory/game";
import form from "../games/form/game";

const drawMenu = (is: InitSettings) => {
  drawBackground(is.ctx);
  // menu x/y
  const x = () => is.ctx.canvas.width / 2;
  const y = (count: number) => () => 200 + (count - 1) * settings.fonts.buttonDistance;
  const opt = () => ({ width: 175 });
  // drop game
  const [stop1, redraw1, move1] = drawButton(is, async () => { 
    stop();
    const health = await drop(is, dropGame.difficulties.easy);
    //alert(health);
    drawMenu(is);
  }, x, y(1), "Drop game", opt);
  // memory game
  const [stop2, redraw2, move2] = drawButton(is, async () => {
    stop();
    const timeRemamining = await memory(is);
    drawMenu(is);
  }, x, y(2), "Memory game", opt);
  // undone
  const [stop3, redraw3, move3] = drawButton(is, async () => {
    stop();
    const health = await form(is, formGame.difficulties.learning);
    drawMenu(is);
  }, x, y(3), "Form game", opt);
  // redraw
  const redraw = () => { drawBackground(is.ctx); redraw1(); redraw2(); redraw3(); redrawFS(); }
  // fullscreen button
  const [stopFS, redrawFS, moveFS] = drawFullscreenButton(is, redraw);
  // observer
  const stopResize = is.addResizeRequest(() => {
    is.prepared = { ...is.prepared, ...reprepareGui(is.ctx) };
    move1();
    move2();
    move3();
    moveFS();
    redraw();
  });
  // stopper
  const stop = () => { stop1(true); stop2(true); stop3(true); stopFS(false); stopResize(); };
  // ret
  return stop;
}

export default drawMenu;
