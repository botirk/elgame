import { Button } from "../../gui/button";
import { drawRoundedBorder, drawRoundedRect } from "../../gui/roundedRect";
import { Init } from "../../init";
import settings from "../../settings";
import { MemoryCard } from "./game";

class Card extends Button {
  private readonly _x: number;
  private readonly _y: number;
  private readonly _height: number;
  private readonly _width: number;
  private cardBgColor() {
    if (this.card.gameState == "failed") return settings.colors.fail; 
    else if (this.card.gameState == "solved&open") return settings.colors.success;
  }
  private redrawFinishedCard() {
    this.init.ctx.fillStyle = settings.colors.bg;
    drawRoundedRect(this.init.ctx, this._x - this._width / 2, this._y - this._height / 2, this._width, this._height, settings.gui.button.rounding);
    this.init.ctx.fillStyle = settings.colors.button.bg;
    drawRoundedBorder(this.init.ctx, this._x - this._width / 2, this._y - this._height / 2, this._width, this._height, settings.gui.button.rounding);
  }
  private updateButtonType() {
    if (this.card.gameState === "closed") {
      this.content = "";
    } else if (this.card.gameState === "open" || this.card.gameState === "failed" || this.card.gameState === "solved&open") {
      if (this.card.guessState === "word") {
        this.content = this.card.word.toLearnText;
      } else {
        this.content = this.card.word.toLearnImg;
      }
    }
  }
  
  constructor(init: Init, card: MemoryCard, x: number, y: number, width: number, height: number, onClick: () => void) {
    super(init, "", () => x, () => y, () => ({
      minHeight: height,
      minWidth: width,
      bgColor: this.cardBgColor(),
      onClick,
    }), true);
    this.redraw = this.redraw.bind(this);
    this.stop = this.stop.bind(this);
    this.update = this.update.bind(this);
    
    this.card = card;
    this._x = x;
    this._y = y;
    const size = this.size();
    this._width = size.width;
    this._height = size.height;

    // glue
    super.redraw();
  }
  update(everything?: boolean, dontUpdateHover?: boolean) {
    this.updateButtonType();
    super.update(everything, dontUpdateHover);
  }
  redraw() {
    if (this.card.gameState !== "solved&closed") super.redraw();
    else this.redrawFinishedCard();
  }
  stop(shouldRedraw?: boolean) {
    super.stop(shouldRedraw);
  }
  readonly card: MemoryCard;
}

export default Card;

