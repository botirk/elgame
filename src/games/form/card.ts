import { WordWithImage } from "..";
import { Button } from "../../gui/button"
import { Init } from "../../init";

class Card extends Button {
  constructor(init: Init, word: WordWithImage, minWidth: number, minHeight: number, onClick: (this: Card) => boolean | void) {
    super(init, word.toLearnImg, 0, 0, { onClick, minWidth, minHeight }, true);
    this._word = word;
  }

  private _word: WordWithImage;
  get word() {
    return this._word;
  }
}

export default Card;
