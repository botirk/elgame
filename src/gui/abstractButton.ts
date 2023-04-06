import { Init } from "../init";
import settings from "../settings";
import { drawRoundedBorder, drawRoundedRect } from "./roundedRect";

type ShouldRedrawAfterClick = boolean | void | Promise<void>;
export interface ButtonOptional {
  minWidth?: number | (() => number),
  minHeight?: number | (() => number),
  bgColor?: string,
  likeLabel?: boolean,
  justBorder?: boolean,
  onClick?: (this) => ShouldRedrawAfterClick,
  disabled?: boolean,
  lateGlue?: boolean,
  invisible?: boolean,
}

export interface Size { width: number, height: number }

export abstract class ButtonLike<T> {
  protected _width: number = 0;
  get width() { return this._width; }

  protected _height: number = 0;
  get height() { return this._height; }

  protected _startX: number = 0;
  get startX() { return this._startX; };

  protected _startY: number = 0;
  get startY() { return this._startY; };

  protected _endX: number = 0;
  get endX() { return this._endX; };

  protected _endY: number = 0;
  get endY() { return this._endY; };

  protected _x: number = 0;
  protected _dynamicX?: () => number;
  get x(): number { return this._x; };
  set x(x: number | (() => number)) {
    this.xy(x, this._dynamicY || this._y);
  }

  protected _y: number = 0;
  protected _dynamicY?: () => number;
  get y(): number { return this._y; };
  set y(y: number | (() => number)) {
    this.xy(this._dynamicX || this._x, y);
  }
  abstract xy(x: number | (() => number), y: number | (() => number));

  protected _minWidth: number = 0;
  abstract get minWidth(): number;
  abstract set minWidth(minWidth: number);

  protected _minHeight: number = 0;
  abstract get minHeight(): number;
  abstract set minHeight(minHeight: number);

  protected _content: T;
  get content() { return this._content; };

  abstract redraw(): void;
  abstract stop(shouldRedrawToDefault?: boolean): void;
  isInArea(x: number, y: number) {
    return x >= this._startX && x <= this._endX && y >= this._startY && y <= this._endY;
  }
  dynamic() {
    if (this._dynamicX) this.x = this._dynamicX();
    if (this._dynamicY) this.y = this._dynamicY();
  }
  
}

abstract class AbstractButton<TContent, TCacheX, TCacheY, TSize extends Size> extends ButtonLike<TContent> implements ButtonOptional {
  protected abstract calcContentSize(): TSize;
  protected abstract calcContentCacheX(): TCacheX;
  protected abstract calcContentCacheY(): TCacheY;
  protected abstract drawer(): void;
  constructor(init: Init, content: TContent, x: number | (() => number), y: number | (() => number), optional?: ButtonOptional) {    
    super();
    this.init = init;
    this.content = content;
    this.xy(x, y);
    Object.entries(optional || {}).forEach(([k, v]) => this[k] = v);
    this.updateManagers();
  }

  protected readonly init: Init;

  bgColor?: string;

  private _onClick?: (this) => ShouldRedrawAfterClick;
  set onClick(onClick: ((this) => ShouldRedrawAfterClick) | undefined) {
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
  get likeLabel() { return !!this._likeLabel; }

  private _disabled?: boolean;
  set disabled(disabled: boolean) {
    if (this._disabled === disabled) return;
    this._disabled = disabled;
    this.updateManagers();
  }
  get disabled() { return !!this._disabled; }

  private _invisible?: boolean;
  set invisible(invisible: boolean) {
    if (this._invisible === invisible) return;
    this._invisible = invisible;
    this.updateManagers();
  }
  get invisible() {
    return !!this._invisible;
  }

  private _justBorder?: boolean;
  set justBorder(justBorder: boolean) {
    if (this._justBorder === justBorder) return;
    this._justBorder = justBorder;
    this.updateManagers();
  }
  get justBorder() {
    return !!this._justBorder;
  }

  private _contentSize: TSize;
  protected get contentSize() {
    return this._contentSize;
  }
  private set contentSize(contentSize: TSize) {
    const oldContentSize = this._contentSize;
    this._contentSize = contentSize;
    if (!oldContentSize || oldContentSize.width !== contentSize.width) {
      this.setwidth(Math.max(this._minWidth, contentSize.width + settings.gui.button.padding * 2));
      this._contentCacheX = this.calcContentCacheX();
    }
    if (!oldContentSize || oldContentSize.height !== contentSize.height) {
      this.setheight(Math.max(this._minHeight, contentSize.height + settings.gui.button.padding * 2));
      this._contentCacheY = this.calcContentCacheY();
    }
  }
  public get contentWidth() {
    return this._contentSize.width;
  }
  public get contentHeight() {
    return this.contentSize.height;
  }

  private _contentCacheX: TCacheX;
  protected get contentCacheX() {
    return this._contentCacheX;
  }

  private _contentCacheY: TCacheY;
  protected get contentCacheY() {
    return this._contentCacheY;
  }
  
  private setwidth(width: number) {
    if (this._width === width) return;
    this._width = width;
    this._startX = this._x - this._width / 2;
    this._endX = this._startX + this._width;
    this.hoverManager?.update();
  }
  static calcWidth(contentWidth: number, minWidth = 0) {
    return Math.max(contentWidth + settings.gui.button.padding * 2, minWidth);
  }

  private _dynamicMinWidth?: () => number;
  set minWidth(minWidth: number | (() => number)) {
    if (typeof(minWidth) === "function") {
      this._dynamicMinWidth = minWidth;
      minWidth = minWidth();
    }
    if (this._minWidth === minWidth) return;
    this._minWidth = minWidth;
    this.setwidth(AbstractButton.calcWidth(this.contentWidth, minWidth));
  }
  get minWidth(): number {
    return this.minWidth;
  }

  private setheight(height: number) {
    if (this._height === height) return;
    this._height = height;
    this._startY = this._y - this._height / 2;
    this._endY = this._startY + this._height;
    this.hoverManager?.update();
  }
  static calcHeight(contentHeight: number, minHeight = 0) {
    return Math.max(contentHeight + settings.gui.button.padding * 2, minHeight);
  }

  private _dynamicMinHeight?: () => number;
  set minHeight(minHeight: number | (() => number)) {
    if (typeof(minHeight) === "function") {
      this._dynamicMinHeight = minHeight;
      minHeight = minHeight();
    }
    if (this._minHeight === minHeight) return;
    this._minHeight = minHeight;
    this.setheight(AbstractButton.calcHeight(this.contentHeight, minHeight));
  }
  get minHeight(): number {
    return this.minHeight;
  }

  xy(x: number | (() => number), y: number | (() => number)) {
    if (typeof(x) == "function") {
      this._dynamicX = x;
      x = x();
    }
    if (typeof(y) == "function") {
      this._dynamicY = y;
      y = y();
    }
    let changed = false;
    if (this._x !== x) {
      changed = true;
      this._x = x;
      this._startX = this._x - this._width / 2;
      this._endX = this._startX + this._width;
      this._contentCacheX = this.calcContentCacheX();
      this.hoverManager?.update();
    }
    if (this._y !== y) {
      changed = true;
      this._y = y;
      this._startY = this._y - this._height / 2;
      this._endY = this._startY + this._height;
      this._contentCacheY = this.calcContentCacheY();
      this.hoverManager?.update();
    }
    if (changed) this.hoverManager?.update();
  }

  set content(content: TContent) {
    if (this._content === content) return;
    super._content = content;
    this.contentSize = this.calcContentSize();
  }
  get content() { return this._content; }

  hoverManager?: ReturnType<Init["addHoverRequest"]>;
  clickManager?: ReturnType<Init["addClickRequest"]>;
  
  private redrawBorder() {
    this.init.ctx.fillStyle = settings.colors.bg;
    drawRoundedRect(this.init.ctx, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, settings.gui.button.rounding);
    this.init.ctx.fillStyle = settings.colors.button.bg;
    drawRoundedBorder(this.init.ctx, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, settings.gui.button.rounding);
  }
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
    if (this?.justBorder || this?._invisible || this?._disabled || this?._likeLabel || !this?.onClick) {
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
            const shouldRedrawAfterClick = this.onClick?.apply(this);
            if (!(shouldRedrawAfterClick instanceof Promise) && shouldRedrawAfterClick !== false) this.redraw();
          } else {
            this.redraw();
          }
        },
        onPressed: () => this.redraw(),
      });
    }
  }
  redraw() {
    if (!this?._invisible) this?._justBorder ? this.redrawBorder() : this?._likeLabel ? this.redrawLabel() : this.redrawContent();
  }
  stop(shouldRedrawToDefault?: boolean) {
    this.clickManager?.stop();
    this.clickManager = undefined;
    this.hoverManager?.stop();
    this.hoverManager = undefined;
    if (shouldRedrawToDefault) this.redraw();
  }
  dynamic() {
    super.dynamic();
    if (this._dynamicMinWidth) this.minWidth = this._dynamicMinWidth();
    if (this._dynamicMinHeight) this.minHeight = this._dynamicMinHeight();
  }
}

export default AbstractButton;
