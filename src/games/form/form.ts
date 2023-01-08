import { WordWithImage } from "..";
import drawBackground from "../../gui/background";
import { drawStatusText, drawStatusTextFail, drawStatusTextSuccess } from "../../gui/status";
import { Init } from "../../init";
import settings, { formGame } from "../../settings";
import Card from "./card";
import { FormCard, FormState } from "./game";

interface CardPlaced {
  word: WordWithImage,
  row: number, column: number,
}

class Form {
  private readonly _init: Init;
  private readonly _quest: WordWithImage;
  private readonly _questions: WordWithImage[];

  private readonly _cards: Card[];
  private readonly _state: FormState;
  private _current?: boolean;
  private _finishMe?: () => void;

  constructor(init: Init, quest: WordWithImage, falseAnswers: WordWithImage[], onClick: (card: WordWithImage) => void, onFinish: (card: WordWithImage) => void, state: FormState) {
    this._init = init;
    this._quest = quest;
    this._questions = [ quest, ...falseAnswers ];
    this._state = state;
    const this2 = this;
    this._cards = this._questions.map((word) => new Card(init, word, this._state.gui.prepared.card.minWidth, this._state.gui.prepared.card.minHeight, function() {
      if (this2._finishMe) {
        this2._finishMe();
      } else {
        this2._finishMe = () => {
          clearTimeout(finishTimeout);
          this2.stop();
          onFinish(word);
          this2._finishMe = () => {};
        }
        const finishTimeout = setTimeout(this2._finishMe, formGame.pause);
        this2._current = (quest === word);
        this.bgColor = (quest === word) ? settings.colors.success : settings.colors.fail;
        onClick(word);
        this2.redrawStatus();
      }
    }));
    this.reposition();
    this.redraw();
  }
  
  private calculateTable(words: WordWithImage[]) {
    const gameWidth = this._init.prepared.gameWidth - settings.gui.margin * 2;
    let columns = Math.max(1, Math.floor(gameWidth / (this._state.gui.prepared.card.minWidth + settings.gui.margin)));
    const rows = Math.max(1, Math.ceil(words.length / columns));
    const lastRowColumns = words.length - (columns * (rows - 1));
    if (rows == 1) columns = lastRowColumns;
    // x 
    const totalWidth = columns * (this._state.gui.prepared.card.minWidth + settings.gui.margin) - settings.gui.margin;
    const widthRemaining = Math.max(0, this._init.prepared.gameWidth - totalWidth);
    const x = settings.gui.margin + this._state.gui.prepared.card.minWidth / 2 + widthRemaining / 2;
    // y
    const totalHeight = rows * (this._state.gui.prepared.card.minHeight + settings.gui.margin) - settings.gui.margin;
    const heightRemaining = Math.max(0, this._init.ctx.canvas.height - settings.gui.status.height - totalHeight);
    const y = settings.gui.status.height + this._state.gui.prepared.card.minHeight / 2 + heightRemaining / 2;
  
    return { columns, rows, lastRowColumns, start: { x, y } };
  }
  private shuffleCards(calculcatedTable: ReturnType<Form["calculateTable"]>): CardPlaced[] {
    const freeCells: { row: number, column: number }[] = [];
    for (let row = 1; row < calculcatedTable.rows; row++) {
      for (let column = 1; column <= calculcatedTable.columns; column++) {
        freeCells.push({ row, column });
      }
    }
    for (let lastRowColumns = 1; lastRowColumns <= calculcatedTable.lastRowColumns; lastRowColumns++) {
      freeCells.push({ row: calculcatedTable.rows, column: lastRowColumns });
    }
    return this._questions.map((word) => {
      const cell = freeCells.splice(Math.floor(Math.random() * freeCells.length), 1)[0];
      return {
        word,
        ...cell,
      };
    });
  }
  private redrawStatus() {
    if (this._current === undefined) {
      drawStatusText(this._init, this._quest.toLearnText, this._state.gameplay.score.total, this._state.gameplay.score.required, this._state.gameplay.score.health, this._state.gui.prepared);
    } else if (this._current === true) {
      drawStatusTextSuccess(this._init, this._quest.toLearnText, this._state.gameplay.score.health, this._state.gui.prepared);
    } else {
      drawStatusTextFail(this._init, this._quest.toLearnText, this._state.gameplay.score.health, this._state.gui.prepared);
    }
  }
  redraw() {
    drawBackground(this._init.ctx);
    this.redrawStatus();
    for (const card of this._cards) card.redraw();
  }
  reposition() {
    const table = this.calculateTable(this._questions);
    const shuffle = this.shuffleCards(table);
    for (const card of this._cards) {
      const cardPlaced = shuffle.find((cardPlaced) => cardPlaced.word === card.word) as CardPlaced;
      card.x = this._init.prepared.gameX + table.start.x + (cardPlaced.column - 1) * (this._state.gui.prepared.card.minWidth + settings.gui.margin);
      card.y = table.start.y + (cardPlaced.row - 1) * (this._state.gui.prepared.card.minHeight + settings.gui.margin);
    }
  }
  stop() {
    for (const card of this._cards) card.stop();
  }
}

export default Form;
