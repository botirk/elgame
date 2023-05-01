import { WordWithImage } from "..";
import { Init } from "../../init";
import settings from "../../settings";
import { FormGameSetup, formSettings as formGame } from "./settings";
import Card from "./card";
import { drawBackground } from "../../gui/background";
import { ButtonGroupGrid } from "../../gui/buttonGroup";
import { randomiseArray } from "../../utils";
import { ButtonLike } from "../../gui/abstractButton";

class OneForm {
  readonly answers: WordWithImage[] = randomiseArray([ this._answer, ...this.falseAnswers ]);

  constructor(private readonly  _init: Init, private readonly _setup: FormGameSetup, readonly _answer: WordWithImage, readonly falseAnswers: WordWithImage[], private _onClick: (this: OneForm, card?: WordWithImage) => void, private _onFinish: (this, card?: WordWithImage) => void, private _redrawStatus: (remainingTime?: Date) => void) {
    const this2 = this;
    this._grid = new ButtonGroupGrid(this._init, this.answers.map((word) => new Card(this._init, word, function() {
      return this2.click(this);
    })), () => this._init.ctx.canvas.width / 2, () => settings.gui.status.height + (this._init.ctx.canvas.height - settings.gui.status.height) / 2);
    this._redrawTimer = setInterval(() => this.redrawStatus(), 90);
    const remainingTime = this.remainingTime();
    if (isFinite(remainingTime)) {
      this._finishTimeout = setTimeout(() => this.click(null), this.remainingTime());
    }
  }

  private readonly _grid: ButtonGroupGrid<Card[]>;
  
  private _endTime = this._setup.maxTime ? new Date(Date.now() + this._setup.maxTime) : undefined;
  private _clickedTime?: Date;
  private _clickedCard?: null | Card;
  get clickedCard() {
    return this._clickedCard;
  }
  
  private _redrawTimer?: NodeJS.Timer;
  private _finishTimeout?: NodeJS.Timeout;
  private click(card: null | Card) {
    if (this.clickedCard !== undefined) {
      this.stop();
      this._onFinish.apply(this, [this.clickedCard?.word]);
      return false;
    } else {
      this._clickedTime = new Date();
      this._clickedCard = card;
      if (card === null) {
        for (const card of this._grid.content) card.bgColor = settings.colors.fail;
      } else if (card.word === this._answer) {
        card.bgColor = settings.colors.success;
      } else {
        card.bgColor = settings.colors.fail;
      }
      this._onClick.apply(this, [card?.word]);
      this.redraw();
      clearInterval(this._redrawTimer);
      this._redrawTimer = undefined;
      clearTimeout(this._finishTimeout);
      this._finishTimeout = setTimeout(() => this.click(card), formGame.pause);
    }
  }


  remainingTime() {
    if (this._endTime) {
      return Math.max(0, this._endTime.getTime() - (this._clickedTime || new Date()).getTime());
    } else {
      return Infinity;
    }      
  }
  stop() {
    clearInterval(this._redrawTimer);
    clearTimeout(this._finishTimeout);
    this._grid.stop();
  }
  private redrawStatus() {
    if (this._endTime) {
      this._redrawStatus(new Date(this.remainingTime()));
    } else {
      this._redrawStatus();
    }
    
  }
  redraw() {
    drawBackground(this._init.ctx);
    this._grid.redraw();
    this.redrawStatus();
  }
  repos() {
    this._grid.dynamic();
  }
}

export default OneForm;
