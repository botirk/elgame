import { Init } from "../init";
import settings from "../settings";
import drawBackground from "./background";
import { drawButton, ButtonManager, drawFullscreenButton, drawButtonWithDescription, calcButtonWithDescription } from "./button";
import { reprepareInit } from "../init";
import { LoadedPlans, loadPlans } from "../asset";
import { calcTextWidth } from "./text";
import { loadProgress, saveProgress } from "../progress";
import scroll from "./events/scroll";

const calcMenu = (init: Init, plans: LoadedPlans, desc: string) => {
  // menu width
  init.ctx.font = settings.fonts.ctxFont;
  const [minWidthGame, minHeight] = plans.reduce((prev, cur) => {
    const calced = calcButtonWithDescription(init, cur.name, cur.label);
    return [Math.max(calced.contentWidth + settings.gui.button.padding * 2, prev[0]), Math.max(calced.contentHeight + settings.gui.button.padding * 2, prev[1])]; 
  }, [0, 0]);
  const minWidthDesc = calcTextWidth(init.ctx, desc) + settings.gui.button.padding * 2;

  // menu x/y
  const isNarrow = () => init.ctx.canvas.width < minWidthGame + settings.gui.button.distance * 4 + minWidthDesc * 2;
  const xGame = () => init.ctx.canvas.width / 2;
  const xDescDesktop = () => xGame() - minWidthGame / 2 - settings.gui.button.distance - minWidthDesc / 2;
  const xDescMobile = xGame;
  const xDesc = () => isNarrow() ? xDescMobile() : xDescDesktop();
  const yGameDesktop = (count: number, scrollPos: number) => -scrollPos + settings.gui.button.distance + minHeight / 2 + ((count - 1) * (minHeight + settings.gui.button.distance));
  const yGameMobile = (i: number, scrollPos: number) => -scrollPos + settings.gui.button.distance + minHeight / 2 + (i * (minHeight + settings.gui.button.distance));
  const yGame = (count: number, i: number, scrollPos: () => number) => () => isNarrow() ? yGameMobile(i, scrollPos()) : yGameDesktop(count, scrollPos());
  const yDescDesktop = yGameDesktop;
  const yDescMobile = yGameMobile;
  const yDesc = (count: number, i: number, scrollPos: () => number) => () => isNarrow() ? yDescMobile(i, scrollPos()) : yDescDesktop(count, scrollPos());
  const minWidth = () => isNarrow() ? minWidthGame : minWidthDesc;
  const totalHeight = () => {
    if (isNarrow()) {
      return (settings.gui.button.distance + minHeight) * 2 * plans.length + settings.gui.button.distance - (settings.gui.button.distance + minHeight);
    } else {
      return (settings.gui.button.distance + minHeight) * plans.length + settings.gui.button.distance;
    }
  }
  return { xGame, xDesc, yGame, yDesc, minWidth, minWidthGame, minHeight, totalHeight };
}

const drawMenu = (init: Init) => {
  // load plan
  const plans = loadPlans(init);
  if (typeof(plans) == "string") {
    alert(plans);
    return;
  }
  const progress = loadProgress(init);
  // calc
  const desc = "Слова";
  const calced = calcMenu(init, plans, desc);
  // scroll
  const scrollManager = scroll(init, () => ({
    maxHeight: calced.totalHeight(),
    oneStep: calced.minHeight + settings.gui.button.distance,
    update: () => update(),
    redraw: () => redraw(),
  }));
  // draw
  drawBackground(init.ctx);
  // drawing
  const buttons: ButtonManager[] = [];
  plans.forEach((plan) => {
    if (plan.viewer) buttons.push(drawButton(init, calced.xDesc, calced.yDesc(plan.place, buttons.length, scrollManager.pos), desc, () => ({ 
      minWidth: calced.minWidth(), minHeight: calced.minHeight,
      disabled: !progress[plan.place],
      onClick: async () => {
        stop();
        await plan.viewer?.();
        drawMenu(init);
      },
    }), true));
    buttons.push(drawButtonWithDescription(init, calced.xGame, calced.yGame(plan.place, buttons.length, scrollManager.pos), plan.name , plan.label, () => ({ 
      minWidth: calced.minWidthGame, minHeight: calced.minHeight, disabled: !progress[plan.place],
      onClick: async () => { 
        stop();
        const stat = await plan.game();
        if (stat.isSuccess && plan.openPlace) {
          plan.openPlace.forEach((openPlace) => progress[openPlace] = true);
          saveProgress(init, progress);
        }
        drawMenu(init);
      },
    }), true));
  });
  // observer
  const stopResize = init.addResizeRequest(() => {
    init.prepared = reprepareInit(init);
    scrollManager.update();
    update();
    redraw();
  });
  // actions
  const stop = () => { buttons.forEach(({ stop }) => stop(true)); buttonFS.stop(true); stopResize(); scrollManager.stop(); };
  const redraw = () => { drawBackground(init.ctx); buttons.forEach(({ redraw }) => redraw()); buttonFS.redraw(); };
  const update = () => { buttons.forEach(({ update }) => update()); buttonFS.update(); }
  // fullscreen button
  const buttonFS = drawFullscreenButton(init, redraw);
  // late glue
  redraw();
  scrollManager.drawScroll();
}

export default drawMenu;
