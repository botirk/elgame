import { InitSettings } from "..";
import settings, { DropGameDifficulty, FormGameDifficulty } from "../settings";
import drawBackground from "./background";
import drawButton, { drawFullscreenButton } from "./button";
import { reprepare as reprepareGui } from "../gui/prepare";
import { WordWithImage } from "../games/word";
import { loadPlans } from "./asset";

const drawMenu = (is: InitSettings) => {
  // load plan
  const plans = loadPlans(is);
  if (typeof(plans) == "string") {
    alert(plans);
    return;
  }
  // draw
  drawBackground(is.ctx);
  // menu x/y
  const x = () => is.ctx.canvas.width / 2;
  const y = (count: number) => () => 200 + (count - 1) * settings.fonts.buttonDistance;
  let minWidth = 225;
  const buttons = plans.map((plan) => drawButton(is, x, y(plan.place), plan.label, () => ({ 
    minWidth: minWidth, 
    onWidthSet: (value) => { minWidth = Math.max(minWidth, value); },
    onClick: async () => { 
      stop();
      const stat = await plan.game();
      drawMenu(is);
    },
  })));
  // observer
  const stopResize = is.addResizeRequest(() => {
    is.prepared = { ...is.prepared, ...reprepareGui(is.ctx) };
    move();
    redraw();
  });
  // actions
  const stop = () => { buttons.forEach(({ stop }) => stop(true)); buttonFS.stop(true); stopResize(); };
  const redraw = () => { drawBackground(is.ctx); buttons.forEach(({ redraw }) => redraw()); buttonFS.redraw(); };
  const move = () => { buttons.forEach(({ update: move }) => move()); buttonFS.update(); }
  // fullscreen button
  const buttonFS = drawFullscreenButton(is, redraw);
  // change button sizes
  move();
  redraw();
}

export default drawMenu;
