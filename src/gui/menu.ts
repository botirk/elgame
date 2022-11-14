import { InitSettings } from "..";
import settings, { DropGameDifficulty, FormGameDifficulty } from "../settings";
import drawBackground from "./background";
import drawButton, { ButtonManager, drawFullscreenButton } from "./button";
import { reprepare as reprepareGui } from "../gui/prepare";
import { WordWithImage } from "../games/word";
import { loadPlans } from "./asset";
import { calcTextWidth } from "./text";
import viewer from "../games/viewer/game";

const drawMenu = (is: InitSettings) => {
  // load plan
  const plans = loadPlans(is);
  if (typeof(plans) == "string") {
    alert(plans);
    return;
  }
  // draw
  drawBackground(is.ctx);
  // menu width
  is.ctx.font = settings.fonts.ctxFont;
  const minWidthGame = plans.reduce((prev, cur) => Math.max(calcTextWidth(is.ctx, cur.label), prev), 0) + settings.gui.button.padding * 2;
  const desc = "Слова";
  const minWidthDesc = calcTextWidth(is.ctx, desc) + settings.gui.button.padding * 2;
  // menu x/y
  const xGame = () => is.ctx.canvas.width / 2;
  const xDesc = () => xGame() + minWidthGame / 2 + settings.gui.button.distance / 2 + minWidthDesc / 2;
  const y = (count: number) => () => 200 + (count - 1) * settings.gui.button.distance;
  // drawing
  const buttons: ButtonManager[] = [];
  plans.forEach((plan) => {
    buttons.push(drawButton(is, xGame, y(plan.place), plan.label, () => ({ 
      minWidth: minWidthGame,
      onClick: async () => { 
        stop();
        const stat = await plan.game();
        drawMenu(is);
      },
    })));
    if (plan.viewer) buttons.push(drawButton(is, xDesc, y(plan.place), desc, () => ({ 
      minWidth: minWidthDesc,
      onClick: async () => { 
        stop();
        await plan.viewer?.();
        drawMenu(is);
      },
    })));
  });
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
}

export default drawMenu;
