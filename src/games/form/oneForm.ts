import { Word, WordWithImage } from "..";
import { Init } from "../../init";
import settings from "../../settings";
import { formSettings as formGame } from "./settings";
import Card from "./card";
import { drawBackground } from "../../gui/background";
import { ButtonGroupGrid } from "../../gui/buttonGroup";
import { randomiseArray } from "../../utils";
import { ButtonLike } from "../../gui/abstractButton";

class OneForm {
  readonly answers: WordWithImage[] = randomiseArray([ this.answer, ...this.falseAnswers ]);

  constructor(private readonly  _init: Init, readonly answer: WordWithImage, readonly falseAnswers: WordWithImage[], onClick: (this: OneForm, card: WordWithImage) => void, onFinish: (this, card: WordWithImage) => void, private _redrawStatus: () => void) {
    const this2 = this;
    this._btns = new ButtonGroupGrid(this._init, this.answers.map((word) => new Card(this._init, word, function() {
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
    })), () => this._init.ctx.canvas.width / 2, () => settings.gui.status.height + (this._init.ctx.canvas.height - settings.gui.status.height) / 2);
  }

  private readonly _btns: ButtonLike<Card[]>;
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
    this._btns.dynamic();
  }
}

export default OneForm;
