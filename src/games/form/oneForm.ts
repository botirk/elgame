import { Word, WordWithImage } from "..";
import drawBackground from "../../gui/background";
import { Init } from "../../init";
import settings, { formGame } from "../../settings";
import Card from "./card";

interface CardPlaced {
  word: WordWithImage,
  row: number, column: number,
}

class OneForm {
  readonly answer: WordWithImage;
  readonly falseAnswers: WordWithImage[];
  readonly answers: WordWithImage[];

  constructor(init: Init, answer: WordWithImage, falseAnswers: WordWithImage[], onClick: (this: OneForm, card: WordWithImage) => void, onFinish: (this, card: WordWithImage) => void, cardWidth: number, cardHeight: number, redrawStatus: () => void, isLateGlue?: boolean) {
    this._init = init;
    this.answer = answer;
    this.falseAnswers = falseAnswers;
    this.answers = [ answer, ...falseAnswers ];
    this._cardWidth = cardWidth;
    this._cardHeight = cardHeight;
    this._redrawStatus = redrawStatus;
    const this2 = this;
    this._cards = this.answers.map((word) => new Card(init, word, this._cardWidth, this._cardHeight, function() {
      if (this2._finishMe) {
        this2._finishMe();
        return false;
      } else {
        this2._finishMe = () => {
          this2._finishMe = () => {};
          clearTimeout(finishTimeout);
          this2.stop();
          onFinish.apply(this2, [word]);
        }
        const finishTimeout = setTimeout(this2._finishMe, formGame.pause);
        this2._clickedWord = word;
        this.bgColor = (answer === word) ? settings.colors.success : settings.colors.fail;
        onClick.apply(this2, [word]);
        this2._redrawStatus();
      }
    }));
    if (!isLateGlue) this.glue();
  }

  private readonly _init: Init;
  private readonly _cards: Card[];
  private readonly _cardWidth: number;
  private readonly _cardHeight: number;
  private readonly _redrawStatus: () => void;
  private _finishMe?: () => void;
  
  private _clickedWord?: Word;
  get clickedWord() {
    return this._clickedWord;
  }
  
  private calculateTable(words: WordWithImage[]) {
    const gameWidth = this._init.prepared.gameWidth - settings.gui.margin * 2;
    let columns = Math.max(1, Math.floor(gameWidth / (this._cardWidth + settings.gui.margin)));
    const rows = Math.max(1, Math.ceil(words.length / columns));
    const lastRowColumns = words.length - (columns * (rows - 1));
    if (rows == 1) columns = lastRowColumns;
    // x 
    const totalWidth = columns * (this._cardWidth + settings.gui.margin) - settings.gui.margin;
    const widthRemaining = Math.max(0, this._init.prepared.gameWidth - totalWidth);
    const x = settings.gui.margin + this._cardWidth / 2 + widthRemaining / 2;
    // y
    const totalHeight = rows * (this._cardHeight + settings.gui.margin) - settings.gui.margin;
    const heightRemaining = Math.max(0, this._init.ctx.canvas.height - settings.gui.status.height - totalHeight);
    const y = settings.gui.status.height + this._cardHeight / 2 + heightRemaining / 2;
  
    return { columns, rows, lastRowColumns, start: { x, y } };
  }
  private shuffleCards(calculcatedTable: ReturnType<OneForm["calculateTable"]>): CardPlaced[] {
    const freeCells: { row: number, column: number }[] = [];
    for (let row = 1; row < calculcatedTable.rows; row++) {
      for (let column = 1; column <= calculcatedTable.columns; column++) {
        freeCells.push({ row, column });
      }
    }
    for (let lastRowColumns = 1; lastRowColumns <= calculcatedTable.lastRowColumns; lastRowColumns++) {
      freeCells.push({ row: calculcatedTable.rows, column: lastRowColumns });
    }
    return this.answers.map((word) => {
      const cell = freeCells.splice(Math.floor(Math.random() * freeCells.length), 1)[0];
      return {
        word,
        ...cell,
      };
    });
  }
  redraw() {
    drawBackground(this._init.ctx);
    this._redrawStatus();
    for (const card of this._cards) card.redraw();
  }
  reposition() {
    const table = this.calculateTable(this.answers);
    const shuffle = this.shuffleCards(table);
    for (const card of this._cards) {
      const cardPlaced = shuffle.find((cardPlaced) => cardPlaced.word === card.word) as CardPlaced;
      card.x = this._init.prepared.gameX + table.start.x + (cardPlaced.column - 1) * (this._cardWidth + settings.gui.margin);
      card.y = table.start.y + (cardPlaced.row - 1) * (this._cardHeight + settings.gui.margin);
    }
  }
  stop() {
    for (const card of this._cards) card.stop();
  }
  glue() {
    this.reposition();
    this.redraw();
  }
}

export default OneForm;
