import { InitSettings } from "../..";
import { LoadedImg } from "../../compileTime/generated";
import { reprepare as reprepareGui } from "../../gui/prepare";
import { memoryGame } from "../../settings";
import { prepare as prepareDraw, Prepared as PreparedDraw } from "../memory/draw";
import { drawState } from "./draw";




const shuffleCards = (imgs: LoadedImg[], prepared: PreparedDraw) => {
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

const reshuffleCards = (cards: MemoryCard[], prepared: PreparedDraw) => {
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
    card.column = -999;
    card.row = -999;
  });
  cards.forEach((card, i1) => {
    for (let i2 = 0; ; i2++) {
      const random = Math.floor(Math.random() * freeCells.length);
      const cell = freeCells[random];
      if (i1 == 0) {
        freeCells.splice(random, 1);
        card.row = cell.row, card.column = cell.column;
        break;
      } else if (i2 == 9) {
        freeCells.splice(random, 1);
        card.row = cell.row, card.column = cell.column;
        break;
      } else {
        const nearSame = cards.filter((cardf) => {
          // at the same row
          if (cardf.row == cell.row) {
            if (cardf.column + 1 == cell.column || cardf.column - 1 == cell.column) return true;
          // at the next row start
          } else if (cell.column == prepared.columns && cell.row + 1 <= prepared.rows) {
            if (cardf.row == cell.row + 1 && cardf.column == 0) return true;
          // at the previous row end
          } else if (cell.column == 0 && cell.row - 1 >= 1) {
            if (cardf.row == cell.row - 1 && cardf.column == prepared.columns) return true;
          }
          return false;
        });
        if (nearSame.length == 0) {
          freeCells.splice(random, 1);
          card.row = cell.row, card.column = cell.column;
          break;
        }
      }
    }
  });
}

export interface MemoryCard {
  img: LoadedImg,
  row: number, column: number,
  guessState: "img" | "word",
  gameState: "open" | "closed" | "failed" | "solved&open" | "solved&closed",
};
export interface MemoryState {
  // gameplay
  gameplay: {
    cards: MemoryCard[],
    solvedCards: number,
  },
  // gui
  gui: {
    prepared: PreparedDraw,
  },
  lastTick: number,
}

const memory = async (is: InitSettings) => {
  const stopResize = is.addResizeRequest(() => {
    is.prepared = { ...is.prepared, ...reprepareGui(is.ctx) };
    state.gui.prepared = prepareDraw(is);
    reshuffleCards(state.gameplay.cards, state.gui.prepared);
    move();
    redraw();
  });
  // state
  const preparedDraw = prepareDraw(is);
  const state: MemoryState = {
    gameplay: {
      cards: shuffleCards(is.prepared.fruits, preparedDraw),
      solvedCards: 0,
    },
    gui: {
      prepared: preparedDraw,
    },
    lastTick: 0,
  };
  // win animation
  const winAnimation = (timeRemaining?: number) => {
    setTimeout(() => {
      const unopenSolved = state.gameplay.cards.filter((card) => card.gameState != "solved&open");
      if (unopenSolved.length > 0) {
        unopenSolved[0].gameState = "solved&open";
        redrawCard(unopenSolved[0]);
        winAnimation(timeRemaining);
      } else gameEnder(timeRemaining);
    }, memoryGame.winTime / state.gameplay.cards.length);
  }
  // render
  let timeout: number | undefined;
  const [stopDraw, redraw, move, redrawCard] = drawState(is, state, (card) => {
    if (state.gameplay.solvedCards == state.gameplay.cards.length) return;
    clearTimeout(timeout);
    for (const failed of state.gameplay.cards.filter((card) => card.gameState == "failed")) {
      failed.gameState = "closed";
      redrawCard(failed);
    }
    for (const solvedOpen of state.gameplay.cards.filter((card) => card.gameState == "solved&open")) {
      solvedOpen.gameState = "solved&closed";
      redrawCard(solvedOpen);
      if ((state.gameplay.solvedCards += 1) == state.gameplay.cards.length) {
        winAnimation();
        break;
      }
    }
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
        timeout = setTimeout(() => {
          card.gameState = "solved&closed";
          redrawCard(card);
          open[0].gameState = "solved&closed";
          redrawCard(open[0]);
          if ((state.gameplay.solvedCards += 2) == state.gameplay.cards.length) winAnimation(); 
        }, 2000);
      } else {
        card.gameState = "failed";
        redrawCard(card);
        open[0].gameState = "failed";
        redrawCard(open[0]);
        timeout = setInterval(() => {
          card.gameState = "closed";
          redrawCard(card);
          open[0].gameState = "closed";
          redrawCard(open[0]);
        }, 2000);
      }
    }
  });
  // promise magic
  let promiseResolve: (timeRemaining?: number) => void;
  const promise = new Promise<number | undefined>((resolve) => promiseResolve = resolve);
  // game ender
  const gameEnder = (timeRemaining?: number) => {
    clearTimeout(timeout);
    stopDraw();
    stopResize();
    promiseResolve(timeRemaining);
  };
  return await promise;
}

export default memory;