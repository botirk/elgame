import { Init } from "../../init";
import settings from "../../settings";

interface Options {
  initialPos?: number,
  maxHeight: () => number,
  oneStep: number,
  onScroll: (pos: number) => void,
}

interface ScrollManager {
  pos: () => number,
  stop: () => void,
  update: () => void,
}

const scroll = (init: Init, options: () => Options): ScrollManager => {
  const state = {
    maxHeight: 0,
    pos: 0,
    oneStep: 0,
    topTouch: undefined as number | undefined,
    botTouch: undefined as number | undefined,
    onScroll: (pos: number) => {},
  }
  const update = () => {
    const optionsLocal = options();
    state.maxHeight = optionsLocal.maxHeight();
    state.pos = Math.min(Math.max(0, state.maxHeight - init.ctx.canvas.height), state.pos);
    state.oneStep = optionsLocal.oneStep;
    state.onScroll = optionsLocal.onScroll;
  }
  update();
  
  const wheelListener = (e: WheelEvent) => {
    const oldPos = state.pos;
    // to top
    if (e.deltaY < 0) state.pos = Math.max(0, state.pos - state.oneStep);
    // to bot
    else if (e.deltaY > 0) state.pos = Math.min(Math.max(0, state.maxHeight - init.ctx.canvas.height), state.pos + state.oneStep);
    
    if (state.pos != oldPos) state.onScroll(state.pos);
  };
  init.ctx.canvas.addEventListener("wheel", wheelListener);

  const touchStartListener = (e: TouchEvent) => {
    if (!e.targetTouches.length) return;
    state.topTouch = Infinity, state.botTouch = -Infinity;
    for (let i = 0; i < e.targetTouches.length; i++) {
      const [_, y] = settings.calculate.toCanvasCoords(init.ctx, e.targetTouches[0].pageX, e.targetTouches[0].pageY);
      if (y < state.topTouch) state.topTouch = y;
      if (y > state.botTouch) state.botTouch = y;
    }
  }
  const touchMoveListener = (e: TouchEvent) => {
    if (!state.topTouch || !state.botTouch || !e.targetTouches.length) return;
    const oldPos = state.pos;
    let topTouch = Infinity, botTouch = -Infinity;
    for (let i = 0; i < e.targetTouches.length; i++) {
      const [_, y] = settings.calculate.toCanvasCoords(init.ctx, e.targetTouches[0].pageX, e.targetTouches[0].pageY);
      if (y < topTouch) topTouch = y;
      if (y > botTouch) botTouch = y;
    }
    // to top
    if (botTouch > state.botTouch) {
      state.pos = Math.max(0, state.pos - (botTouch - state.botTouch));
      state.botTouch = botTouch;
    }
    // to bot
    if (topTouch < state.topTouch) {
      state.pos = Math.min(Math.max(0, state.maxHeight - init.ctx.canvas.height), state.pos + (state.topTouch - topTouch));
      state.topTouch = topTouch;
    }
    if (state.pos != oldPos) state.onScroll(state.pos);
  }
  const touchEndListener = (e: TouchEvent) => {
    state.topTouch = undefined, state.botTouch = undefined;
  }
  init.ctx.canvas.addEventListener("touchstart", touchStartListener);
  init.ctx.canvas.addEventListener("touchmove", touchMoveListener);
  init.ctx.canvas.addEventListener("touchend", touchEndListener);


  return {
    pos: () => state.pos,
    stop: () => {
      init.ctx.canvas.removeEventListener("wheel", wheelListener);
      init.ctx.canvas.removeEventListener("touchstart", touchStartListener);
      init.ctx.canvas.removeEventListener("touchmove", touchMoveListener);
      init.ctx.canvas.removeEventListener("touchend", touchEndListener);
    },
    update,
  };
}

export default scroll;