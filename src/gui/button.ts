import { Init } from "../init";
import settings from "../settings";
import AbstractButton, { Size } from "./abstractButton";
import { calcTextWidth } from "./text";

export class Button extends AbstractButton<string | HTMLImageElement, number, number, Size> {
  protected drawer(): void {
    if (typeof(this.content) == "string") {
      this.init.ctx.fillStyle = settings.colors.textColor;
      this.init.ctx.fillText(this.content, this.contentCacheX, this.contentCacheY);
    } else {
      drawIcon(this.init, this.contentCacheX, this.contentCacheY, this.content);
    }
  }
  protected calcContentCacheX() {
    if (typeof(this.content) == "string") {
      return this.x - this.contentWidth / 2;
    } else {
      return this.x - this.contentWidth / 2;
    }
  }
  protected calcContentCacheY() {
    if (typeof(this.content) == "string") {
      return this.y + settings.fonts.fontSize / 3;
    } else {
      return this.y - this.contentHeight / 2;
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
