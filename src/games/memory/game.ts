import { EndGameStats } from "..";
import { Init } from "../../init";
import { drawFullscreenButton } from "../../gui/button";
import { reprepareInit } from "../../init";
import { promiseMagic } from "../../utils";
import { memoryGame } from "../../settings";
import { prepare as prepareDraw, Prepared as PreparedDraw } from "../memory/draw";
import { WordWithImage } from "..";
import { drawState } from "./draw";




const shuffleCards = (imgs: WordWithImage[], prepared: PreparedDraw) => {
  const result: MemoryState["gameplay"]["cards"] = [];
  imgs.forEach((img) => {
    result.push({
      word: img,
      row: 0, column: 0,
      guessState: "img",
      gameState: "closed",
    });
    result.push({
      word: img,
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
  word: WordWithImage,
  row: number, column: number,
  guessState: "img" | "word",
  gameState: "open" | "closed" | "failed" | "solved&open" | "solved&closed",
};
export interface MemoryState {
  // gameplay
  gameplay: {
    cards: MemoryCard[],
    remainingCards: number,
  },
  // gui
  gui: {
    prepared: PreparedDraw,
  },
}

const memory = (init: Init, words: WordWithImage[]) => async () => {
  const stopResize = init.addResizeRequest(() => {
    init.prepared = reprepareInit(init);
    state.gui.prepared = prepareDraw(init, words);
    reshuffleCards(state.gameplay.cards, state.gui.prepared);
    move();
    buttonFS.update();
    redraw();
    buttonFS.redraw();
  });
  // state
  const preparedDraw = prepareDraw(init, words);
  const state: MemoryState = {
    gameplay: {
      cards: shuffleCards(words, preparedDraw),
      remainingCards: words.length * 2,
    },
    gui: {
      prepared: preparedDraw,
    },
  };
  // win animation
  const winAnimation = (timeRemaining?: number) => {
    setTimeout(() => {
      const unopenSolved = state.gameplay.cards.filter((card) => card.gameState != "solved&open");
      if (unopenSolved.length > 0) {
        unopenSolved[0].gameState = "solved&open";
        redrawCard(unopenSolved[0]);
        winAnimation(timeRemaining);
      } else gameEnder({ isSuccess: true });
    }, memoryGame.winTime / state.gameplay.cards.length);
  }
  // fs button
  const buttonFS = drawFullscreenButton(init, () => redraw());
  // render
  let timeout: NodeJS.Timeout | undefined;
  const [stopDraw, redraw, move, redrawCard] = drawState(init, state, (card) => {
    if (state.gameplay.remainingCards <= 0) return;
    clearTimeout(timeout);
    for (const failed of state.gameplay.cards.filter((card) => card.gameState == "failed")) {
      failed.gameState = "closed";
      redrawCard(failed);
    }
    for (const solvedOpen of state.gameplay.cards.filter((card) => card.gameState == "solved&open")) {
      solvedOpen.gameState = "solved&closed";
      redrawCard(solvedOpen);
      if ((state.gameplay.remainingCards -= 1) <= 0) {
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
      if (open[0].word == card.word) {
        card.gameState = "solved&open";
        redrawCard(card);
        open[0].gameState = "solved&open";
        redrawCard(open[0]);
        timeout = setTimeout(() => {
          card.gameState = "solved&closed";
          redrawCard(card);
          open[0].gameState = "solved&closed";
          redrawCard(open[0]);
          if ((state.gameplay.remainingCards -= 2) <= 0) winAnimation(); 
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

  const [promise, gameEnder] = promiseMagic<EndGameStats>(() => {
    clearTimeout(timeout);
    stopDraw();
    stopResize();
    buttonFS.stop(false);
  });
  return await promise;
}

export default memory;