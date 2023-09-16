import { AbstractGame, EndGameStats, WordWithImage } from "..";
import settings from "../../settings";
import { FormGameSetup, formSettings as formGame } from "./settings";
import { ButtonGroupGrid } from "../../gui/buttonGroup";
import { randomiseArray } from "../../utils";

class Form extends AbstractGame<{ answer: WordWithImage, falseAnswers: WordWithImage[], setup: FormGameSetup }, EndGameStats> {
  protected init(): void {
    
  }

  readonly answers: WordWithImage[] = randomiseArray([ this.content.answer, ...this.content.falseAnswers ]);

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
    this._grid.screenResize();
  }
}

export default Form;
