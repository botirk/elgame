import { Init } from "../../init";
import settings from "../../settings";

interface ScrollOptions {
  initialPos?: number,
  maxHeight: number,
  oneStep: number,
  redraw: () => void,
  update: () => void,
}

interface ScrollManager {
  pos: () => number,
  stop: () => void,
  update: () => void,
  drawScroll: () => void,
}

const initScrollState = {
  maxHeight: 0, pos: 0, oneStep: 0, topTouch: undefined as number | undefined, botTouch: undefined as number | undefined, redraw: () => {}, update: () => {}
}

const scrollState = (init: Init, options: () => ScrollOptions, state = { ...initScrollState }) => {
  const localOptions = options();
  state.maxHeight = localOptions.maxHeight;
  state.pos = Math.min(Math.max(0, localOptions.maxHeight - init.ctx.canvas.height), state.pos),
  state.oneStep = localOptions.oneStep;
  state.redraw = localOptions.redraw;
  state.update = localOptions.update;
  return state;
};

const scroll = (init: Init, options: () => ScrollOptions): ScrollManager => {
  init.ctx.canvas.style.touchAction = "none";
  let state = scrollState(init, options);
  const update = () => { state = scrollState(init, options, state); };
  
  const maxPos = () => Math.max(0, state.maxHeight - init.ctx.canvas.height);
  const wheelListener = (e: WheelEvent) => {
    const oldPos = state.pos;
    // to top
    if (e.deltaY < 0) state.pos = Math.max(0, state.pos - state.oneStep);
    // to bot
    else if (e.deltaY > 0) state.pos = Math.min(maxPos(), state.pos + state.oneStep);
    
    if (state.pos != oldPos) {
      state.update();
      state.redraw();
      drawScroll();
    }
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
      state.pos = Math.min(maxPos(), state.pos + (state.topTouch - topTouch));
      state.topTouch = topTouch;
    }
    if (state.pos != oldPos) {
      state.update();
      state.redraw();
      drawScroll();
    }
  }
  const touchEndListener = (e: TouchEvent) => {
    state.topTouch = undefined, state.botTouch = undefined;
  }
  init.ctx.canvas.addEventListener("touchstart", touchStartListener);
  init.ctx.canvas.addEventListener("touchmove", touchMoveListener);
  init.ctx.canvas.addEventListener("touchend", touchEndListener);

  const stop = () => {
    init.ctx.canvas.removeEventListener("wheel", wheelListener);
    init.ctx.canvas.removeEventListener("touchstart", touchStartListener);
    init.ctx.canvas.removeEventListener("touchmove", touchMoveListener);
    init.ctx.canvas.removeEventListener("touchend", touchEndListener);
    clearTimeout(hideTimeout);
  }

  let hideTimeout: NodeJS.Timeout | undefined = undefined;
  const drawScroll = () => {
    const pagePercent = init.ctx.canvas.height / state.maxHeight;
    if (pagePercent >= 1) return;
    const heightPercent = state.pos / maxPos();
    const scrollHeight = init.ctx.canvas.height * pagePercent;
    const scrollPos = (init.ctx.canvas.height - scrollHeight) * heightPercent;
    init.ctx.fillStyle = settings.colors.button.bg;
    init.ctx.fillRect(init.ctx.canvas.width - settings.gui.scroll.width - settings.gui.scroll.padding, scrollPos, settings.gui.scroll.width, scrollHeight);
    if (hideTimeout !== undefined) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => { state.redraw(); hideTimeout = undefined; }, settings.gui.scroll.timeout);
  }

  return {
    pos: () => state.pos,
    stop,
    update,
    drawScroll,
  };
}

export default scroll;