import { Init } from "../init";
import settings from "../settings";
import AbstractButton from "./abstractButton";
import { calcTextWidth } from "./text";

export class ButtonWithDescription extends AbstractButton<
  { text: string, description: string }, 
  { text: number, desc: number }, 
  { text: number, desc: number },
  ReturnType<typeof ButtonWithDescription.calcContentSize>
> {

  protected drawer(): void {
    this.ctx.ctx.fillStyle = settings.colors.textColor;
    this.ctx.ctx.fillText(this.content.text, this.contentCacheX.text, this.contentCacheY.text);
    this.ctx.ctx.strokeStyle = settings.colors.textColor;
    this.ctx.ctx.beginPath();
    this.ctx.ctx.moveTo(this.startX, this.y);
    this.ctx.ctx.lineTo(this.endX, this.y);
    this.ctx.ctx.stroke();
    this.ctx.ctx.fillText(this.content.description, this.contentCacheX.desc, this.contentCacheY.desc);
  }
  static calcContentSize(ctx: CanvasRenderingContext2D, text: string, description: string) {
    const firstWidth = calcTextWidth(ctx, text);
    const secondWidth = calcTextWidth(ctx, description);
    const oneHeight = settings.fonts.fontSize;
    return {
      firstWidth, secondWidth, oneHeight,
      width: Math.max(firstWidth, secondWidth),
      height: oneHeight * 2 + 1,
    };
  }
  protected calcContentSize() {
    return ButtonWithDescription.calcContentSize(this.ctx.ctx, this.content.text, this.content.description);
  }
  protected calcContentCacheX() {
    return {
      text: this.x - this.contentSize.firstWidth / 2,
      desc: this.x - this.contentSize.secondWidth / 2,
    }
  }
  protected calcContentCacheY() {
    return {
      text: this.y - 1 - settings.fonts.fontSize / 3,
      desc: this.y + settings.fonts.fontSize,
    }
  }
}
