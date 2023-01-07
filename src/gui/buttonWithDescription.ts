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
type ButtonWithDescriptionContentSize = ReturnType<typeof calcButtonWithDescription>;

export class ButtonWithDescription<TData> extends AbstractButton<{ text: string, description: string }> {
  private cachedTextX: number;
  private cachedTextY: number;
  private cachedDescX: number;
  private cachedDescY: number;
  private cachedContentSize: ButtonWithDescriptionContentSize;
  
  set x(x: number | (() => number)) {
    super.x = x;
    this.cachedTextX = this.x - this.cachedContentSize.firstWidth / 2;
    this.cachedDescX = this.x - this.cachedContentSize.secondWidth / 2;
  }
  get x(): number {
    return super.x;
  }

  set y(y: number | (() => number)) {
    super.y = y;
    this.cachedTextY = this.y - 1 - settings.fonts.fontSize / 3,
    this.cachedDescY = this.y + settings.fonts.fontSize;
  }
  get y(): number {
    return super.y;
  }

  set content(content: { text: string, description: string }) {
    this.cachedContentSize = calcButtonWithDescription(this.init, content.text, content.description);
    super.content = content;
  }
  get content() {
    return super.content;
  }

  protected drawer(): void {
    this.init.ctx.fillStyle = settings.colors.textColor;
    this.init.ctx.fillText(this.content.text, this.cachedTextX, this.cachedTextY);
    this.init.ctx.strokeStyle = settings.colors.textColor;
    this.init.ctx.beginPath();
    this.init.ctx.moveTo(this.startX, this.y);
    this.init.ctx.lineTo(this.endX, this.y);
    this.init.ctx.stroke();
    this.init.ctx.fillText(this.content.description, this.cachedDescX, this.cachedDescY);
  }
  protected calcContentSize() {
    return this.cachedContentSize;
  }
}
