import { InitSettings } from "../..";
import { LoadedImg } from "../../compileTime/generated";
import { calcTextWidth } from "../../gui/text";
import settings, { memoryGame } from "../../settings";
import { drawState } from "./draw";

const calculateCardSize = (is: InitSettings, imgs: LoadedImg[]) => {
  let height = settings.fonts.fontSize + settings.gui.button.padding * 2;
  let width = settings.gui.button.padding * 2;
  is.ctx.font = settings.fonts.ctxFont;
  imgs.forEach((img) => {
    height = Math.max(height, img.img.height + settings.gui.button.padding * 2);
    width = Math.max(width, calcTextWidth(is.ctx, img.name) + settings.gui.button.padding * 2, img.img.width + settings.gui.button.padding * 2);
  });
  return { height, width };
}

const calculateTable = (is: InitSettings, imgs: LoadedImg[], cardSize: { height: number, width: number }) => {
  const columns = Math.max(1, Math.floor(is.prepared.gameWidth / (cardSize.width + memoryGame.margin)));
  const rows = Math.max(1, Math.ceil((imgs.length * 2) / columns));
  const lastRowColumns = (imgs.length * 2) - (columns * (rows - 1));
  return { columns, rows, lastRowColumns };
}

const prepare = (is: InitSettings) => {
  const card = calculateCardSize(is, is.prepared.fruits);
  return {
    card,
    ...calculateTable(is, is.prepared.fruits, card),
  };
}
type Prepared = ReturnType<typeof prepare>;


const shuffleCards = (imgs: LoadedImg[], prepared: Prepared) => {
  const result: MemoryState["gameplay"]["cards"] = [];
  imgs.forEach((img) => {
    result.push({
      img,
      row: 0, column: 0,
      guessState: "img",
      gameState: "closed",
    });
    result.push({
      img,
      row: 0, column: 0,
      guessState: "word",
      gameState: "closed",
    });
  });
  reshuffleCards(result, prepared);
  return result;
}

const reshuffleCards = (cards: MemoryState["gameplay"]["cards"], prepared: Prepared) => {
  const freeCells: { row: number, column: number }[] = [];
  for (let row = 1; row < prepared.rows; row++) {
    for (let column = 1; column <= prepared.columns; column++) {
      freeCells.push({ row, column });
    }
  }
  for (let lastRowColumns = 1; lastRowColumns <= prepared.lastRowColumns; lastRowColumns++) {
    freeCells.push({ row: prepared.rows, column: lastRowColumns });
  }
  cards.forEach((card) => {
    const random = Math.floor(Math.random() * freeCells.length);
    const cell = freeCells.splice(random, 1)[0];
    card.row = cell.row, card.column = cell.column;
  });
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
  const prepared = prepare(is);
  const state: MemoryState = {
    gameplay: {
      cards: shuffleCards(is.prepared.fruits, prepared),
      solvedCards: 0,
      prepared,
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