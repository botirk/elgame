import { AbstractGame, EndGameStats } from "..";
import { Init } from "../../init";
import { reprepareInit } from "../../init";
import { promiseMagic, removeRandomInArray } from "../../utils";
import settings, { memoryGame } from "../../settings";
import { prepare as prepareDraw, Prepared as PreparedDraw } from "../memory/draw";
import { WordWithImage } from "..";
import { drawState } from "./draw";
import FullscreenButton from "../../gui/fullscreenButton";
import Card, { GuessState } from "./card";
import { calcTextWidth } from "../../gui/text";
import drawBackground from "../../gui/background";

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
  /*const stopResize = init.addResizeRequest(() => {
    init.prepared = reprepareInit(init);
    state.gui.prepared = prepareDraw(init, words);
    reshuffleCards(state.gameplay.cards, state.gui.prepared);
    update();
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
        updateRedrawCard(unopenSolved[0]);
        winAnimation(timeRemaining);
      } else gameEnder({ isSuccess: true });
    }, memoryGame.winTime / state.gameplay.cards.length);
  }
  // fs button
  const buttonFS = new FullscreenButton(init, () => redraw());
  // render
  let timeout: NodeJS.Timeout | undefined;
  const { stop, redraw, update, updateRedrawCard } = drawState(init, state, (card) => {
    if (state.gameplay.remainingCards <= 0) return;
    clearTimeout(timeout);
    for (const failed of state.gameplay.cards.filter((card) => card.gameState == "failed")) {
      failed.gameState = "closed";
      updateRedrawCard(failed);
    }
    for (const solvedOpen of state.gameplay.cards.filter((card) => card.gameState == "solved&open")) {
      solvedOpen.gameState = "solved&closed";
      updateRedrawCard(solvedOpen);
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
      updateRedrawCard(card);
    } else if (open.length == 1) {
      if (open[0].word == card.word) {
        card.gameState = "solved&open";
        updateRedrawCard(card);
        open[0].gameState = "solved&open";
        updateRedrawCard(open[0]);
        timeout = setTimeout(() => {
          card.gameState = "solved&closed";
          updateRedrawCard(card);
          open[0].gameState = "solved&closed";
          updateRedrawCard(open[0]);
          if ((state.gameplay.remainingCards -= 2) <= 0) winAnimation(); 
        }, 2000);
      } else {
        card.gameState = "failed";
        updateRedrawCard(card);
        open[0].gameState = "failed";
        updateRedrawCard(open[0]);
        timeout = setInterval(() => {
          card.gameState = "closed";
          updateRedrawCard(card);
          open[0].gameState = "closed";
          updateRedrawCard(open[0]);
        }, 2000);
      }
    }
  });

  const [promise, gameEnder] = promiseMagic<EndGameStats>(() => {
    clearTimeout(timeout);
    stop();
    stopResize();
    buttonFS.stop(false);
  });
  return await promise;*/
}



const calcCardSize = (init: Init, words: WordWithImage[]) => {
  let height = settings.fonts.fontSize + settings.gui.button.padding * 2;
  let width = settings.gui.button.padding * 2;
  words.forEach((img) => {
    height = Math.max(height, img.toLearnImg.height + settings.gui.button.padding * 2);
    width = Math.max(width, calcTextWidth(init.ctx, img.toLearnText) + settings.gui.button.padding * 2, img.toLearnImg.width + settings.gui.button.padding * 2);
  });
  return { height, width };
}

const calcMemory = (init: Init, words: WordWithImage[]) => {
  return {
    card: calcCardSize(init, words),
  }
}

const calcTable = (init: Init, words: WordWithImage[], cardSize: ReturnType<typeof calcCardSize>) => {
  const gameWidth = init.prepared.gameWidth - memoryGame.margin * 2;
  let columns = Math.max(1, Math.floor(gameWidth / (cardSize.width + memoryGame.margin)));
  const rows = Math.max(1, Math.ceil((words.length * 2) / columns));
  const lastRowColumns = (words.length * 2) - (columns * (rows - 1));
  if (rows == 1) columns = lastRowColumns;
  // x 
  const totalWidth = columns * (cardSize.width + memoryGame.margin) - memoryGame.margin;
  const widthRemaining = Math.max(0, init.prepared.gameWidth - totalWidth);
  const x = memoryGame.margin + cardSize.width / 2 + widthRemaining / 2;
  // y
  const totalHeight = rows * (cardSize.height + memoryGame.margin) - memoryGame.margin;
  const heightRemaining = Math.max(0, init.ctx.canvas.height - totalHeight);
  const y = memoryGame.margin + cardSize.height / 2 + heightRemaining / 2;

  return { columns, rows, lastRowColumns, start: { x, y } };
}

const calcCards = (init: Init, cardSize: ReturnType<typeof calcCardSize>, table: ReturnType<typeof calcTable>) => {
  const result: { x, y }[] = [];
  for (let row = 0; row < table.rows; row++) {
    for (let column = 0; column < table.columns; column++) {
      result.push({
        x: init.prepared.gameX + table.start.x + (column - 1) * (cardSize.width + memoryGame.margin),
        y: table.start.y + (row - 1) * (cardSize.height + memoryGame.margin),
      })
    }
  }
  return result;
}

const calcMemoryPos = (init: Init, words: WordWithImage[], cardSize: ReturnType<typeof calcCardSize>) => {
  const table = calcTable(init, words, cardSize);
  const cards = calcCards(init, cardSize, table);
  return { table, cards };
}

class Memory extends AbstractGame<WordWithImage[], ReturnType<typeof calcMemory>, ReturnType<typeof calcMemoryPos>, EndGameStats> {
  private _remainingCards: number = this.content.length * 2;
  private _cards: Card[];
  private _timer?: NodeJS.Timer;
  
  private finishCardAction() {
    for (const failed of this._cards.filter((card) => card.gameState == "failed")) {
      failed.gameState = "closed";
      failed.redraw();
    }
    for (const solvedOpen of this._cards.filter((card) => card.gameState == "solved&open")) {
      solvedOpen.gameState = "solved&closed";
      solvedOpen.redraw();
      if ((this._remainingCards -= 1) <= 0) {
        this.winAnimation();
        break;
      }
    }
  };
  private shuffleWords()  {
    const result: { word: WordWithImage, guessState: GuessState }[] = [];
    const freePos: number[] = [];
    for (let i = 0; i < this.content.length * 2; i++) freePos.push(i);
    for (const word of this.content) {
      let pos: number | undefined;
      for (let tryCount = freePos.length * 5; tryCount > 0; tryCount -= 1) {
        pos = removeRandomInArray(freePos);
        if (tryCount > 1 && (result[pos-1]?.word === word || result[pos+1]?.word === word)) {
          freePos.push(pos);
          pos = undefined;
        } else {
          break;
        }
      }
      result[pos as number] = { word, guessState: "image" };

      pos = undefined;
      for (let tryCount = freePos.length * 5; tryCount > 0; tryCount -= 1) {
        pos = removeRandomInArray(freePos);
        if (tryCount > 1 && (result[pos-1]?.word === word || result[pos+1]?.word === word)) {
          freePos.push(pos);
          pos = undefined;
        } else {
          break;
        }
      }
      result[pos as number] = { word, guessState: "word" };
    }
    return result;
  }
  private winAnimation() {

  }
  protected onGameStart(): void {
    drawBackground(this.init.ctx);
    const this2 = this;
    this._cards = this.shuffleWords().map((shuffled, i) => new Card(
      this.init, shuffled.word, shuffled.guessState, 
      () => this.preparedPos.cards[i].x,
      () => this.preparedPos.cards[i].y, 
      this.prepared.card.width, this.prepared.card.height,
      function() {
        if (this2._remainingCards <= 0) return;
        // finish previous card animations
        clearTimeout(this2._timer);
        this2.finishCardAction();
        // register click only for closed cards
        if (this.gameState !== "closed") return;
        const open = this2._cards.filter((card) => card.gameState === "open");
        if (open.length === 0) {
          this.gameState = "open";
        } else if (open.length === 1) {
          if (open[0].word === this.word) {
            this.gameState = "solved&open";
            open[0].gameState = "solved&open";
          } else {
            this.gameState = "failed";
            open[0].gameState = "failed";
          }
          open[0].redraw();
          this2._timer = setTimeout(() => this2.finishCardAction(), 2000);
        }
      }
    ));
  }
  protected onGameEnd(): void {
    
  }
  protected prepare() {
    return calcMemory(this.init, this.content);
  }
  protected preparePos() {
    return calcMemoryPos(this.init, this.content, this.prepared.card);
  }
  protected redraw(): void {
    
  }
  protected scrollOptions(): { oneStep: number; maxHeight: number; } {
    return { oneStep: 0, maxHeight: 0 };
  }
  protected update(): void {
    
  }
}

export default Memory;
