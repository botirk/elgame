import { Word, WordWithImage } from "..";
import { Init } from "../../init";
import settings from "../../settings";
import { formSettings as formGame } from "./settings";
import Card from "./card";
import { drawBackground } from "../../gui/background";
import ButtonGroup from "../../gui/buttonGroup";
import { randomiseArray } from "../../utils";
import AbstractButton from "../../gui/abstractButton";

class OneForm {
  readonly answer: WordWithImage;
  readonly falseAnswers: WordWithImage[];
  readonly answers: WordWithImage[];

  constructor(init: Init, answer: WordWithImage, falseAnswers: WordWithImage[], onClick: (this: OneForm, card: WordWithImage) => void, onFinish: (this, card: WordWithImage) => void, redrawStatus: () => void) {
    this._init = init;
    this.answer = answer;
    this.falseAnswers = falseAnswers;
    this.answers = randomiseArray([ answer, ...falseAnswers ]);
    this._redrawStatus = redrawStatus;
    const this2 = this;
    this._btns = new ButtonGroup(this._init, this.answers.map((word) => new Card(init, word, function() {
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
    })), "grid", { x: () => this2._init.ctx.canvas.width / 2, y: () => settings.gui.status.height + (this2._init.ctx.canvas.height - settings.gui.status.height) / 2 });
  }

  private readonly _init: Init;
  private readonly _btns: ButtonGroup<AbstractButton<any,any,any,any>>;
  private readonly _redrawStatus: () => void;
  private _finishMe?: () => void;
  
  private _clickedWord?: Word;
  get clickedWord() {
    return this._clickedWord;
  }
  stop() {
    this._btns.stop();
  }
  redraw() {
    drawBackground(this._init.ctx);
    this._redrawStatus();
    this._btns.redraw();
  }
  repos() {
    this._btns.repos();
  }
}

export default OneForm;
