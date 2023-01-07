import { Init } from "../init";
import settings from "../settings";
import drawBackground from "./background";
import { reprepareInit } from "../init";
import { LoadedPlans, loadPlans } from "../asset";
import { calcTextWidth } from "./text";
import { loadProgress, saveProgress } from "../progress";
import Scroll from "./events/scroll";
import { ButtonWithDescription, calcButtonWithDescription } from "./buttonWithDescription";
import AbstractButton from "./abstractButton";
import { Button } from "./button";
import FullscreenButton from "./fullscreenButton";

const calcMenu = (init: Init, plans: LoadedPlans, desc: string) => {
  // menu width
  const [minWidthGame, minHeight] = plans.reduce((prev, cur) => {
    const calced = calcButtonWithDescription(init, cur.name, cur.label);
    return [Math.max(calced.width + settings.gui.button.padding * 2, prev[0]), Math.max(calced.height + settings.gui.button.padding * 2, prev[1])]; 
  }, [0, 0]);
  const minWidthDesc = calcTextWidth(init.ctx, desc) + settings.gui.button.padding * 2;

  // menu x/y
  const isNarrow = () => init.ctx.canvas.width < minWidthGame + settings.gui.button.distance * 4 + minWidthDesc * 2;
  const xGame = () => init.ctx.canvas.width / 2;
  const xDescDesktop = () => xGame() - minWidthGame / 2 - settings.gui.button.distance - minWidthDesc / 2;
  const xDescMobile = xGame;
  const xDesc = () => isNarrow() ? xDescMobile() : xDescDesktop();
  const yGameDesktop = (count: number, scrollPos: number) => -scrollPos + settings.gui.button.distance + minHeight / 2 + ((count - 1) * (minHeight + settings.gui.button.distance));
  const yGameMobile = (count: number, i: number, scrollPos: number) => {
    // starting marging + block margin + button margin
    return -scrollPos + settings.gui.button.distance + minHeight / 2  + (count - 1) * settings.gui.button.distance + (i * (minHeight + settings.gui.button.distance));
  }
  const yGame = (count: number, i: number, scrollPos: () => number) => () => isNarrow() ? yGameMobile(count, i, scrollPos()) : yGameDesktop(count, scrollPos());
  const yDescDesktop = yGameDesktop;
  const yDescMobile = yGameMobile;
  const yDesc = (count: number, i: number, scrollPos: () => number) => () => isNarrow() ? yDescMobile(count, i, scrollPos()) : yDescDesktop(count, scrollPos());
  const minWidth = () => isNarrow() ? minWidthGame : minWidthDesc;
  const totalHeight = () => {
    if (isNarrow()) {
      // two buttons per plan + blocks margin + margin at botton - one "all words" button at top
      return (settings.gui.button.distance + minHeight) * 2 * plans.length + settings.gui.button.distance * (plans.length - 1) + settings.gui.button.distance - (settings.gui.button.distance + minHeight);
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
  const scroll = new Scroll(init, () => ({
    saveId: "menu",
    maxHeight: calced.totalHeight(),
    oneStep: calced.minHeight + settings.gui.button.distance,
    update: () => dynamycPos(),
    redraw: () => redraw(),
  }));
  // draw
  drawBackground(init.ctx);

  // drawing
  const buttons: AbstractButton<any>[] = [];
  plans.forEach((plan) => {
    if (plan.viewer) buttons.push(new Button(init, desc, calced.xDesc(), calced.yDesc(plan.place, buttons.length, scroll.pos), { 
      minWidth: calced.minWidth(), minHeight: calced.minHeight,
      disabled: !progress[plan.place],
      onClick: async () => {
        stop();
        await plan.viewer?.();
        drawMenu(init);
      },
    }, true));
    buttons.push(new ButtonWithDescription(init, { text: plan.name, description: plan.label }, calced.xGame(), calced.yGame(plan.place, buttons.length, scroll.pos), { 
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
    }, true));
  });

  console.log(calced.minHeight, buttons[0].height, buttons[1].height);
  // observer
  const stopResize = init.addResizeRequest(() => {
    init.prepared = reprepareInit(init);
    scroll.update();
    dynamycPos();
    redraw();
  });
  const dynamycPos = () => { for (const button of buttons) button.dynamicPos(); };
  const stop = () => { for (const button of buttons) button.stop(true); buttonFS.stop(true); stopResize(); scroll.stop(); };
  const redraw = () => { drawBackground(init.ctx); for (const button of buttons) button.redraw(); buttonFS.redraw(); };
  // fullscreen button
  const buttonFS = new FullscreenButton(init, redraw);
  // late glue
  redraw();
  scroll.drawScroll();
}

export default drawMenu;
