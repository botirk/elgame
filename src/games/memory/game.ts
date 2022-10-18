import { InitSettings } from "../..";
import { LoadedImg } from "../../compileTime/generated";
import { calcTextWidth } from "../../gui/text";
import settings from "../../settings";
import { drawState } from "./draw";

const prepare = (is: InitSettings) => {
  return {
    
  }
}
type Prepared = ReturnType<typeof prepare>;

const calculateSizes = (is: InitSettings, imgs: LoadedImg[]) => {
  let maxHeight = settings.fonts.fontSize + settings.gui.button.padding * 2;
  let maxWidth = settings.gui.button.padding * 2;
  is.ctx.font = settings.fonts.ctxFont;
  imgs.forEach((img) => {
    maxHeight = Math.max(maxHeight, img.img.height + settings.gui.button.padding * 2);
    maxWidth = Math.max(maxWidth, calcTextWidth(is.ctx, img.name) + settings.gui.button.padding * 2);
  })

  return { maxHeight, maxWidth };
}

const shuffleCards = (imgs: LoadedImg[]) => {
  const result: MemoryState["gameplay"]["cards"] = [];
  imgs.forEach((img) => {
    result.push({
      img,
      row: 1, column: result.length + 1,
      guessState: "img",
      gameState: "closed",
    });
    result.push({
      img,
      row: 1, column: result.length + 1,
      guessState: "word",
      gameState: "closed",
    });
  });
  return result;
}

export interface MemoryState {
  // gameplay
  gameplay: {
    cards: {
      img: LoadedImg,
      row: number, column: number,
      guessState: "img" | "word",
      gameState: "solved" | "open" | "closed",
    }[],
    solvedCards: number,
    prepared: Prepared,
  },
  // gui
  gui: {
    
  },
  lastTick: number,
}

const memory = async (is: InitSettings) => {
  const stopResize = is.addResizeRequest(() => {

  });


  // state
  const state: MemoryState = {
    gameplay: {
      cards: shuffleCards(is.prepared.fruits),
      solvedCards: 0,
      prepared: prepare(is),
    },
    gui: {
      
    },
    lastTick: 0,
  };
  // render
  const render = () => {
    drawState(is, state);
  }
  render();
  // promise magic
  let promiseResolve: () => void;
  const promise = new Promise<void>((resolve) => promiseResolve = resolve);
  // game ender
  const gameEnder = (healthCount: number) => {
    stopResize();
    promiseResolve();
  };
  return await promise;
}

export default memory;