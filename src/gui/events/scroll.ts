import { Init } from "../../init";

interface Options {
  initialPos?: number,
  maxPos: number,
  oneStep: number,
  onScroll: (pos: number) => void,
}

interface ScrollManager {
  pos: () => number,
  stop: () => void,
}

const scroll = (init: Init, options: () => Options): ScrollManager => {
  const state = {
    maxPos: 0,
    pos: 0,
    oneStep: 0,
    onScroll: (pos: number) => {},
  }
  const update = () => {
    const optionsLocal = options();
    state.maxPos = optionsLocal.maxPos;
    state.oneStep = optionsLocal.oneStep;
    state.onScroll = optionsLocal.onScroll;
  }
  update();
  
  const wheelListener = (e: WheelEvent) => {
    if (e.deltaY > 0) state.pos = Math.max(0, state.pos - state.oneStep);
    else if (e.deltaY < 0) state.pos = Math.min(state.maxPos, state.pos + state.oneStep);
    state.onScroll(state.pos);
  };
  init.ctx.canvas.addEventListener("wheel", wheelListener);

  return {
    pos: () => state.pos,
    stop: () => {
      init.ctx.canvas.removeEventListener("wheel", wheelListener);
    },
  };
}

export default scroll;