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
  const [minWidthGame, minHeight] = plans.reduce((prev, cur) => {
    const calced = calcButtonWithDescription(init, cur.name, cur.label);
    return [Math.max(calced.contentWidth + settings.gui.button.padding * 2, prev[0]), Math.max(calced.contentHeight + settings.gui.button.padding * 2, prev[1])]; 
  }, [0, 0]);
  const desc = "Слова";
  const minWidthDesc = calcTextWidth(init.ctx, desc) + settings.gui.button.padding * 2;
  // menu x/y
  const isNarrow = () => init.ctx.canvas.width < minWidthGame + settings.gui.button.distance * 4 + minWidthDesc * 2;
  const xGame = () => init.ctx.canvas.width / 2;
  const xDescDesktop = () => xGame() - minWidthGame / 2 - settings.gui.button.distance - minWidthDesc / 2;
  const xDescMobile = xGame;
  const xDesc = () => isNarrow() ? xDescMobile() : xDescDesktop();
  const yGameDesktop = (count: number) => settings.gui.button.distance + minHeight / 2 + ((count - 1) * (minHeight + settings.gui.button.distance));
  const yGameMobile = (i: number) => settings.gui.button.distance + minHeight / 2 + (i * (minHeight + settings.gui.button.distance));
  const yGame = (count: number, i: number) => () => isNarrow() ? yGameMobile(i) : yGameDesktop(count);
  const yDescDesktop = yGameDesktop;
  const yDescMobile = yGameMobile;
  const yDesc = (count: number, i: number) => () => isNarrow() ? yDescMobile(i) : yDescDesktop(count);
  // drawing
  const buttons: ButtonManager[] = [];
  plans.forEach((plan) => {
    if (plan.viewer) buttons.push(drawButton(init, xDesc, yDesc(plan.place, buttons.length), desc, () => ({ 
      minWidth: isNarrow() ? minWidthGame : minWidthDesc, minHeight: minHeight,
      disabled: !progress[plan.place],
      onClick: async () => { 
        stop();
        await plan.viewer?.();
        drawMenu(init);
      },
    })));
    buttons.push(drawButtonWithDescription(init, xGame, yGame(plan.place, buttons.length), plan.name , plan.label, () => ({ 
      minWidth: minWidthGame, minHeight: minHeight, disabled: !progress[plan.place],
      onClick: async () => { 
        stop();
        const stat = await plan.game();
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
