import { InitSettings } from "..";
import settings, { DropGameDifficulty, FormGameDifficulty } from "../settings";
import drawBackground from "./background";
import drawButton, { drawFullscreenButton } from "./button";
import { reprepare as reprepareGui } from "../gui/prepare";
import { WordWithImage } from "../games/word";
import plan from "../compileTime/plan";

import drop from "../games/drop/game";
import memory from "../games/memory/game";
import form from "../games/form/game";

const drawMenu = (is: InitSettings) => {
  drawBackground(is.ctx);
  // menu x/y
  const x = () => is.ctx.canvas.width / 2;
  const y = (count: number) => () => 200 + (count - 1) * settings.fonts.buttonDistance;
  let minWidth = 225;
  const buttons = Object.values(plan).map((plan, i) => drawButton(is, async () => { 
    stop();
    const [words, missing] = plan.words.reduce((prev, cur) => {
      if (is.prepared.words[cur]?.toLearnImg) prev[0].push(is.prepared.words[cur]);
      else prev[1].push(cur);
      return prev;
    }, [[], []] as [WordWithImage[], string[]]);
    if (missing.length > 0) {
      alert(`Words not found in collection: ${missing.join(', ')}`);
    } else if (plan.game == "form" && (plan.dif as FormGameDifficulty)?.endCount != undefined) {
      const stat = await form(is, { words, dif: plan.dif as FormGameDifficulty});
    } else if (plan.game == "drop" && (plan.dif as DropGameDifficulty)?.successCountPerWord != undefined) {
      const stat = await drop(is, { words, dif: plan.dif as DropGameDifficulty });
    } else if (plan.game == "memory") {
      const stat = await memory(is, { words });
    } else {
      alert(`Damaged game plan #${i}`);
    }
    // alert(health);
    drawMenu(is);
  }, x, y(i + 1), plan.label, () => ({ minWidth: minWidth, onWidthSet: (value) => { minWidth = Math.max(minWidth, value); console.log(minWidth); } })));
  // observer
  const stopResize = is.addResizeRequest(() => {
    is.prepared = { ...is.prepared, ...reprepareGui(is.ctx) };
    move();
    redraw();
  });
  // actions
  const stop = () => { buttons.forEach(({ stop }) => stop(true)); buttonFS.stop(true); stopResize(); };
  const redraw = () => { drawBackground(is.ctx); buttons.forEach(({ redraw }) => redraw()); buttonFS.redraw(); };
  const move = () => { buttons.forEach(({ move }) => move()); buttonFS.move(); }
  // fullscreen button
  const buttonFS = drawFullscreenButton(is, redraw);
  // change button sizes
  move();
  redraw();
}

export default drawMenu;
