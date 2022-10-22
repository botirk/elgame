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
      gameState: "open" | "closed" | "failed" | "solved&open" | "solved&closed",
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
  const closeOpenCards = () => {
    const toClose = state.gameplay.cards.filter((card) => card.gameState == "open" || card.gameState == "failed");
  }
  const [stopDraw, redrawCards, redrawCard] = drawState(is, state, (card) => {
    state.gameplay.cards.filter((card) => card.gameState == "failed").forEach((failed) => {
      failed.gameState = "closed";
      redrawCard(failed);
    });
    state.gameplay.cards.filter((card) => card.gameState == "solved&open").forEach((solvedOpen) => {
      solvedOpen.gameState = "solved&closed";
      redrawCard(solvedOpen);
    });
    // register click only for closed cards
    if (card.gameState != "closed") return;
    const open = state.gameplay.cards.filter((card) => card.gameState == "open");
    if (open.length == 0) {
      card.gameState = "open";
      redrawCard(card);
    } else if (open.length == 1) {
      if (open[0].img.name == card.img.name) {
        card.gameState = "solved&open";
        redrawCard(card);
        open[0].gameState = "solved&open";
        redrawCard(open[0]);
      } else {
        card.gameState = "failed";
        redrawCard(card);
        open[0].gameState = "failed";
        redrawCard(open[0]);
      }
    }
  });
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