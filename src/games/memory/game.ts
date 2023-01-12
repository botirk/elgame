import { AbstractGame, EndGameStats } from "..";
import { Init } from "../../init";
import { removeRandomInArray } from "../../utils";
import settings from "../../settings";
import { settings as memoryGame } from "./settings";
import { WordWithImage } from "..";
import Card, { GuessState } from "./card";
import { calcTextWidth } from "../../gui/text";
import drawBackground from "../../gui/background";

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
  const totalWidth = memoryGame.margin * 2 + columns * (cardSize.width + memoryGame.margin) - memoryGame.margin;
  const widthRemaining = Math.max(0, init.prepared.gameWidth - totalWidth);
  const x = memoryGame.margin + cardSize.width / 2 + widthRemaining / 2;
  // y
  const totalHeight = memoryGame.margin * 2 + rows * (cardSize.height + memoryGame.margin) - memoryGame.margin;
  const heightRemaining = Math.max(0, init.ctx.canvas.height - totalHeight);
  const y = memoryGame.margin + cardSize.height / 2 + heightRemaining / 2;

  return { columns, rows, lastRowColumns, start: { x, y }, totalHeight, totalWidth };
}

const calcCards = (init: Init, cardSize: ReturnType<typeof calcCardSize>, table: ReturnType<typeof calcTable>) => {
  const result: { x, y }[] = [];
  for (let row = 0; row < table.rows; row++) {
    for (let column = 0; column < table.columns; column++) {
      result.push({
        x: init.prepared.gameX + table.start.x + column * (cardSize.width + memoryGame.margin),
        y: table.start.y + row * (cardSize.height + memoryGame.margin),
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
  constructor(init: Init, words: WordWithImage[]) {
    super(init, words, true);
    this.onGameStart();
  }
  
  private _remainingCards: number = this.content.length * 2;
  private _cards: Card[];
  private _timer?: NodeJS.Timer;
  private _wonCards: Card[] = [];
  
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
  private shuffleWords() {
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
  private async winAnimation() {
    await new Promise((resolve) => {
      setTimeout(resolve, memoryGame.winTime / this._wonCards.length);
    });
    for (const card of this._wonCards) {
      card.gameState = "solved&open";
      card.redraw();
      await new Promise((resolve) => {
        setTimeout(resolve, memoryGame.winTime / this._wonCards.length);
      });
    }
    this.gameEnder({ isSuccess: true });
  }
  protected onGameStart(): void {
    drawBackground(this.init.ctx);
    const this2 = this;
    this._cards = this.shuffleWords().map((shuffled, i) => new Card(
      this.init, shuffled.word, shuffled.guessState, 
      () => this.preparedPos.cards[i].x,
      () => -this.scroll.pos() + this.preparedPos.cards[i].y,
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
            this2._wonCards.unshift(open[0]);
            this2._wonCards.unshift(this);
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
    for (const card of this._cards) card.stop();
    clearTimeout(this._timer);
  }
  protected prepare() {
    return calcMemory(this.init, this.content);
  }
  protected preparePos() {
    return calcMemoryPos(this.init, this.content, this.prepared.card);
  }
  protected redraw(): void {
    drawBackground(this.init.ctx);
    for (const card of this._cards) card.redraw();
  }
  protected scrollOptions(): { oneStep: number; maxHeight: number; } {
    return { oneStep: this.prepared.card.height, maxHeight: this.preparedPos.table.totalHeight };
  }
  protected update(): void {
    for (const card of this._cards) card.dynamicPos();
  }
}

export default Memory;
