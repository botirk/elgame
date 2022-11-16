import { Init } from "../init";
import settings from "../settings";
import drawBackground from "./background";
import { drawButton, ButtonManager, drawFullscreenButton } from "./button";
import { reprepareInit } from "../init";
import { loadPlans } from "../asset";
import { calcTextWidth } from "./text";

const drawMenu = (init: Init) => {
  // load plan
  const plans = loadPlans(init);
  if (typeof(plans) == "string") {
    alert(plans);
    return;
  }
  // draw
  drawBackground(init.ctx);
  // menu width
  init.ctx.font = settings.fonts.ctxFont;
  const minWidthGame = plans.reduce((prev, cur) => Math.max(calcTextWidth(init.ctx, cur.label), prev), 0) + settings.gui.button.padding * 2;
  const desc = "Слова";
  const minWidthDesc = calcTextWidth(init.ctx, desc) + settings.gui.button.padding * 2;
  // menu x/y
  const xGame = () => init.ctx.canvas.width / 2;
  const xDesc = () => xGame() + minWidthGame / 2 + settings.gui.button.distance / 2 + minWidthDesc / 2;
  const y = (count: number) => () => 200 + (count - 1) * settings.gui.button.distance;
  // drawing
  const buttons: ButtonManager[] = [];
  plans.forEach((plan) => {
    const isOpen = (plan.place == 1);
    buttons.push(drawButton(init, xGame, y(plan.place), plan.label, () => ({ 
      minWidth: minWidthGame,
      disabled: !isOpen,
      onClick: async () => { 
        stop();
        const stat = await plan.game();
        drawMenu(init);
      },
    })));
    if (plan.viewer) buttons.push(drawButton(init, xDesc, y(plan.place), desc, () => ({ 
      minWidth: minWidthDesc,
      disabled: !isOpen,
      onClick: async () => { 
        stop();
        await plan.viewer?.();
        drawMenu(init);
      },
    })));
  });
  // observer
  const stopResize = init.addResizeRequest(() => {
    init.prepared = reprepareInit(init);
    move();
    redraw();
  });
  // actions
  const stop = () => { buttons.forEach(({ stop }) => stop(true)); buttonFS.stop(true); stopResize(); };
  const redraw = () => { drawBackground(init.ctx); buttons.forEach(({ redraw }) => redraw()); buttonFS.redraw(); };
  const move = () => { buttons.forEach(({ update: move }) => move()); buttonFS.update(); }
  // fullscreen button
  const buttonFS = drawFullscreenButton(init, redraw);
}

export default drawMenu;
