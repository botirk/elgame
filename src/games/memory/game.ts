import { InitSettings } from "../..";
import { LoadedImg } from "../../compileTime/generated";

const prepare = (is: InitSettings) => {
  return {
    rows: 1,
    columns: 1,
  }
}
type Prepared = ReturnType<typeof prepare>;

export interface MemoryState {
  // gameplay
  gameplay: {
    cards: { 
      img: LoadedImg,
      isSolved: boolean,
      isOpen: boolean,
    }[],
    solvedCards: number,
    prepared: Prepared,
  },
  // gui
  gui: {
    
  }
}

const memory = async (is: InitSettings) => {
  // size change
  const resizeObserver = new ResizeObserver(() => {
    
  });
  resizeObserver.observe(is.ctx.canvas);
  // promise magic
  let promiseResolve: (healthCount: number) => void;
  const promise = new Promise<number>((resolve) => promiseResolve = resolve);
  // game ender
  const gameEnder = (healthCount: number) => {
    resizeObserver.disconnect();
    promiseResolve(healthCount);
  };
  return await promise;
}

export default memory;