import { Init } from "../init";
import settings from "../settings";
import AbstractButton from "./abstractButton";
import { calcTextWidth } from "./text";



export class Button extends AbstractButton<string | HTMLImageElement> {
  private cachedX: number;
  private cachedY: number;

  set x(x: number | (() => number)) {
    super.x = x;
    if (typeof(this.content) == "string") {
      this.cachedX = this.x - this.contentWidth / 2;
    } else {
      this.cachedX = this.x - this.contentWidth / 2;
    }
  }
  get x(): number {
    return super.x;
  }

  set y(y: number | (() => number)) {
    super.y = y;
    if (typeof(this.content) == "string") {
      this.cachedY = this.y + settings.fonts.fontSize / 3;
    } else {
      this.cachedY = this.y - this.contentHeight / 2;
    }
  }
  get y(): number {
    return super.y;
  }
  
  protected drawer(): void {
    if (typeof(this.content) == "string") {
      this.init.ctx.fillStyle = settings.colors.textColor;
      this.init.ctx.fillText(this.content, this.cachedX, this.cachedY);
    } else {
      drawIcon(this.init, this.cachedX, this.cachedY, this.content);
    }
  }
  protected calcContentSize() {
    if (typeof(this.content) == "string") {
      return {
        width: calcTextWidth(this.init.ctx, this.content),
        height: settings.fonts.fontSize,
      }
    } else {
      return {
        width: this.content.width,
        height: this.content.height,
      }
    }
  }
}









export const drawIcon = (init: Init, x: number, y: number, img: HTMLImageElement) => {
  init.ctx.drawImage(img, x, y, img.width, img.height);
}
