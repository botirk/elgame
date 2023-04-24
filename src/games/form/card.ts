import { WordWithImage } from "..";
import { Button } from "../../gui/button"
import { Init } from "../../init";

class Card extends Button {
  constructor(init: Init, readonly word: WordWithImage, onClick: (this: Card) => boolean | void) {
    super(init, word.toLearnImg, 0, 0, { onClick });
  }
}

export default Card;
