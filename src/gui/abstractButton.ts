import { Init } from "../init";
import settings from "../settings";
import { drawRoundedRect } from "./roundedRect";

type ShouldRedrawAfterClick = boolean | void | Promise<void>;
export interface ButtonOptional {
  minWidth?: number,
  minHeight?: number,
  bgColor?: string,
  likeLabel?: boolean,
  onClick?: () => ShouldRedrawAfterClick,
  disabled?: boolean,
  lateGlue?: boolean,
  invisible?: boolean,
}

abstract class AbstractButton<TContent> implements ButtonOptional {
  protected abstract calcContentSize(): { width: number, height: number };
  protected abstract drawer(): void;
  constructor(init: Init, content: TContent, x: number | (() => number), y: number | (() => number), optional?: ButtonOptional, isLateGlue?: boolean) {    
    this.init = init;
    this.content = content;
    this.x = x;
    this.y = y;
    Object.entries(optional || {}).forEach(([k, v]) => this[k] = v);
    this.redraw();
    this.updateManagers();
    if (!isLateGlue) {
      
    }
  }

  protected readonly init: Init;

  bgColor?: string;

  private _onClick?: () => ShouldRedrawAfterClick;
  set onClick(onClick: (() => ShouldRedrawAfterClick) | undefined) {
    this._onClick = onClick;
    this.updateManagers();
  }
  get onClick() {
    return this._onClick;
  }

  private _likeLabel?: boolean;
  set likeLabel(likeLabel: boolean) {
    if (this._likeLabel === likeLabel) return;
    this._likeLabel = likeLabel;
    this.updateManagers();
  }
  get likeLabel() {
    return !!this._likeLabel;
  }

  private _disabled?: boolean;
  set disabled(disabled: boolean) {
    if (this._disabled === disabled) return;
    this._disabled = disabled;
    this.updateManagers();
  }
  get disabled() {
    return !!this._disabled;
  }

  private _invisible?: boolean;
  set invisible(invisible: boolean) {
    if (this._invisible === invisible) return;
    this._invisible = invisible;
    this.updateManagers();
  }
  get invisible() {
    return !!this._invisible;
  }

  private _contentWidth: number;
  private set contentWidth(contentWidth: number) {
    if (this._contentWidth === contentWidth) return;
    this._contentWidth = contentWidth;
    this.width = Math.max(this._minWidth, contentWidth + settings.gui.button.padding * 2);
  }
  public get contentWidth() {
    return this._contentWidth;
  }

  private _width: number;
  private set width(width: number) {
    if (this._width === width) return;
    this._width = width;
    this._startX = this._x - this._width / 2;
    this._endX = this._startX + this._width;
  }
  public get width() {
    return this._width;
  }

  private _minWidth: number = 0;
  set minWidth(minWidth: number) {
    this._minWidth = minWidth;
    this.width = Math.max(this._contentWidth + settings.gui.button.padding * 2, minWidth);
  }
  get minWidth() {
    return this.minWidth;
  }

  private _contentHeight: number;
  private set contentHeight(contentHeight: number) {
    if (this._contentHeight === contentHeight) return;
    this._contentHeight = contentHeight;
    this.height = Math.max(this._minHeight, contentHeight + settings.gui.button.padding * 2);
  }
  public get contentHeight() {
    return this._contentHeight;
  }

  private _height: number;
  private set height(height: number) {
    if (this._height === height) return;
    this._height = height;
    this._startY = this._y - this._height / 2;
    this._endY = this._startY + this._height;
  }
  public get height() {
    return this._height;
  }

  private _minHeight: number = 0;
  set minHeight(minHeight: number) {
    this._minHeight = minHeight;
    this.height = Math.max(this._contentHeight + settings.gui.button.padding * 2, this._minHeight);
  }
  get minHeight() {
    return this.minHeight;
  }

  private _startX: number;
  get startX() {
    return this._startX;
  }
  private _endX: number;
  get endX() {
    return this._endX;
  }

  private _dynamicX?: () => number;
  private _x: number;
  set x(x: number | (() => number)) {
    if (typeof(x) == "function") {
      this._dynamicX = x;
      this._x = x();
    } else {
      this._x = x;
    }
    this._startX = this._x - this._width / 2;
    this._endX = this._startX + this._width;
  }
  get x(): number {
    return this._x;
  }

  private _startY: number;
  get startY() {
    return this._startY;
  }
  private _endY: number;
  get endY() {
    return this._endY;
  }

  private _dynamicY?: () => number;
  private _y: number;
  set y(y: number | (() => number)) {
    if (typeof(y) == "function") {
      this._dynamicY = y;
      this._y = y();
    } else {
      this._y = y;
    }
    this._startY = this._y - this._height / 2;
    this._endY = this._startY + this._height;
  }
  get y(): number {
    return this._y;
  }

  private _content: TContent;
  get content() {
    return this._content;
  }
  set content(content: TContent) {
    if (this._content === content) return;
    this._content = content;
    const contentSize = this.calcContentSize();
    this.contentWidth = contentSize.width;
    this.contentHeight = contentSize.height;
  }

  hoverManager?: ReturnType<Init["addHoverRequest"]>;
  clickManager?: ReturnType<Init["addClickRequest"]>;
  
  private redrawLabel() {
    if (this?.bgColor) {
      this.init.ctx.fillStyle = this.bgColor;
    } else if (this?._disabled) {
      this.init.ctx.fillStyle = settings.colors.button.disabled;
    } else {
      this.init.ctx.fillStyle = settings.colors.button.bg;
    }
    this.init.ctx.fillRect(this._startX, this._startY, this._width, this._height);
    this.drawer();
  }
  private redrawContent() {
    if (this?.bgColor) {
      this.init.ctx.fillStyle = this.bgColor;
    } else if (this?._disabled) {
      this.init.ctx.fillStyle = settings.colors.button.disabled;
    } else if (this.clickManager?.isPressed()) {
      this.init.ctx.fillStyle = settings.colors.button.pressed;
    } else if (this.hoverManager?.isInArea()) {
      this.init.ctx.fillStyle = settings.colors.button.hover;
    } else {
      this.init.ctx.fillStyle = settings.colors.button.bg;
    }
    if (this.hoverManager?.isInArea() && !this?._disabled) {
      this.init.ctx.canvas.style.cursor = "pointer";
    } else {
      this.init.ctx.canvas.style.cursor = "default";
    }
    drawRoundedRect(this.init.ctx, this._startX, this._startY, this._width, this._height, settings.gui.button.rounding);
    this.drawer();
  }
  private updateManagers() {
    if (this?._invisible || this?._disabled || this?._likeLabel || !this?.onClick) {
      this.hoverManager?.stop();
      this.hoverManager = undefined;
      this.clickManager?.stop();
      this.clickManager = undefined;
    } else {
      this.hoverManager ||= this.init.addHoverRequest({
        isInArea: (x, y) => this.isInArea(x, y),
        onHover: () => this.redraw(),
        onLeave: () => this.redraw(),
      });
      this.clickManager ||= this.init.addClickRequest({
        isInArea: (x, y) => this.isInArea(x, y),
        onReleased: (isInArea) => { 
          if (isInArea) {
            const shouldRedrawAfterClick = this.onClick?.();
            if (!(shouldRedrawAfterClick instanceof Promise) && shouldRedrawAfterClick !== false) this.redraw();
          } else {
            this.redraw();
          }
        },
        onPressed: () => this.redraw(),
      });
    }
  }
  isInArea(x: number, y: number) {
    return x >= this._startX && x <= this._endX && y >= this._startY && y <= this._endY;
  }
  redraw() {
    if (!this?._invisible) this?._likeLabel ? this.redrawLabel() : this.redrawContent();
  }
  stop(shouldRedrawToDefault?: boolean) {
    this.clickManager?.stop();
    this.clickManager = undefined;
    this.hoverManager?.stop();
    this.hoverManager = undefined;
    if (shouldRedrawToDefault) this.redraw();
  }
  dynamicPos() {
    if (this._dynamicX) this.x = this._dynamicX();
    if (this._dynamicY) this.y = this._dynamicY();
  }
}

export default AbstractButton;
