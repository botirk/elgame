import settings from "../settings";
import AbstractButton, { Size } from "./abstractButton";
import { calcTextWidth } from "./text";

export class Button extends AbstractButton<string | HTMLImageElement, number, number, Size> {
  protected drawer(): void {
    if (this.content === undefined) {
      return;
    } else if (typeof(this.content) == "string") {
      this.ctx.ctx.fillStyle = settings.colors.textColor;
      this.ctx.ctx.fillText(this.content, this.contentCacheX, this.contentCacheY);
    } else {
      this.ctx.drawIcon(this.contentCacheX, this.contentCacheY, this.content);
    }
  }
  protected calcContentCacheX() {
    if (typeof(this.content) == "string") {
      return this.x - this.contentSize.width / 2;
    } else {
      return this.x - this.contentSize.width / 2;
    }
  }
  protected calcContentCacheY() {
    if (typeof(this.content) == "string") {
      return this.y + settings.fonts.fontSize / 3;
    } else {
      return this.y - this.contentSize.height / 2;
    }
  }
  static calcContentSize(ctx: CanvasRenderingContext2D, content: string | HTMLImageElement | undefined) {
    if (content === undefined) {
      return {
        width: 0,
        height: 0,
      }
    } else if (typeof(content) == "string") {
      return {
        width: calcTextWidth(ctx, content),
        height: settings.fonts.fontSize,
      }
    } else {
      return {
        width: content.width,
        height: content.height,
      }
    }
  }
  protected calcContentSize() {
    return Button.calcContentSize(this.ctx.ctx, this.content);
  }
}
