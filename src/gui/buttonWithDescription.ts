import { Init } from "../init";
import settings from "../settings";
import AbstractButton from "./abstractButton";
import { calcTextWidth } from "./text";

export const calcButtonWithDescription = (init: Init, text: string, description: string) => {
  const firstWidth = calcTextWidth(init.ctx, text);
  const secondWidth = calcTextWidth(init.ctx, description);
  const oneHeight = settings.fonts.fontSize;
  return {
    firstWidth, secondWidth, oneHeight,
    width: Math.max(firstWidth, secondWidth),
    height: oneHeight * 2 + 1,
  };
}

export class ButtonWithDescription extends AbstractButton<
  { text: string, description: string }, 
  { text: number, desc: number }, 
  { text: number, desc: number },
  ReturnType<typeof calcButtonWithDescription>
> {

  protected drawer(): void {
    this.init.ctx.fillStyle = settings.colors.textColor;
    this.init.ctx.fillText(this.content.text, this.contentCacheX.text, this.contentCacheY.text);
    this.init.ctx.strokeStyle = settings.colors.textColor;
    this.init.ctx.beginPath();
    this.init.ctx.moveTo(this.startX, this.y);
    this.init.ctx.lineTo(this.endX, this.y);
    this.init.ctx.stroke();
    this.init.ctx.fillText(this.content.description, this.contentCacheX.desc, this.contentCacheY.desc);
  }
  protected calcContentSize() {
    return calcButtonWithDescription(this.init, this.content.text, this.content.description);
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
