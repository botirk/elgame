import { Init } from "../init";
import settings from "../settings";
import drawBackground from "./background";
import { drawButton, ButtonManager, drawFullscreenButton, drawButtonWithDescription, calcButtonWithDescription } from "./button";
import { reprepareInit } from "../init";
import { loadPlans } from "../asset";
import { calcTextWidth } from "./text";
import { loadProgress } from "../progress";

const drawMenu = (init: Init) => {
  // load plan
  const plans = loadPlans(init);
  const progress = loadProgress();
  if (typeof(plans) == "string") {
    alert(plans);
    return;
  }
  // draw
  drawBackground(init.ctx);
  // menu width
  init.ctx.font = settings.fonts.ctxFont;
  const [minWidth, minHeight] = plans.reduce((prev, cur) => {
    const calced = calcButtonWithDescription(init, cur.name, cur.label);
    return [Math.max(calced.contentWidth + settings.gui.button.padding * 2, prev[0]), Math.max(calced.contentHeight + settings.gui.button.padding * 2, prev[1])]; 
  }, [0, 0]);
  const desc = "Слова";
  const minWidthDesc = calcTextWidth(init.ctx, desc) + settings.gui.button.padding * 2;
  // menu x/y
  const xGame = () => init.ctx.canvas.width / 2;
  const xDesc = () => xGame() + minWidth / 2 + settings.gui.button.distance / 2 + minWidthDesc / 2;
  const y = (count: number) => () => 200 + ((count - 1) * settings.gui.button.distance) * 1.4;
  // drawing
  const buttons: ButtonManager[] = [];
  plans.forEach((plan) => {
    buttons.push(drawButtonWithDescription(init, xGame, y(plan.place), plan.name , plan.label, () => ({ 
      minWidth, minHeight, disabled: !progress[plan.place],
      onClick: async () => { 
        stop();
        const stat = await plan.game();
        drawMenu(init);
      },
    })));
    if (plan.viewer) buttons.push(drawButton(init, xDesc, y(plan.place), desc, () => ({ 
      minWidth: minWidthDesc, minHeight,
      disabled: !progress[plan.place],
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
