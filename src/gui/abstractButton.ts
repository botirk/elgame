import settings from "../settings";
import CTX from "./CTX";
import { Button } from "./button";
import { ClickManager } from "./events/click";
import { HoverManager } from "./events/hover";

type ShouldRedrawAfterClick = boolean | void | Promise<void>;
export interface ButtonOptional {
  minWidth?: number,
  minHeight?: number,
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
  constructor(protected readonly ctx: CTX) { }

  screenResize() { }

  private _width: number = 0;
  get width() { return this._width; }
  protected set width(width: number) {
    if (this._width === width) return;
    this._width = width;
    this.newWidth(width);
  }
  protected newWidth(width: number) {
    this._startX = this.x - width / 2;
    this._endX = this._startX + width;
  }

  private _height: number = 0;
  get height() { return this._height; }
  protected set height(height: number) {
    if (this._height === height) return;
    this._height = height;
    this.newHeight(height);
  }
  protected newHeight(height: number) {
    this._startY = this.y - height / 2;
    this._endY = this._startY + height;
  }

  protected _startX: number = 0;
  get startX() { return this._startX; };

  protected _startY: number = 0;
  get startY() { return this._startY; };

  protected _endX: number = 0;
  get endX() { return this._endX; };

  protected _endY = 0;
  get endY() { return this._endY; };

  private _x = 0;
  get x(): number { 
    return this._x;
  }
  set x(x: number) {
    if (this._x === x) return;
    this._x = x;
    this.newX();
    this.newPos();
  }
  protected newX() {
    this._startX = this._x - this._width / 2;
    this._endX = this._startX + this._width;
  }

  private _y = 0;
  get y(): number { 
    return this._y;
  }
  set y(y: number) {
    if (this._y === y) return;
    this._y = y;
    this.newY();
    this.newPos();
  }
  protected newY() {
    this._startY = this._y - this._height / 2;
    this._endY = this._startY + this._height;
  }

  protected newPos() { }

  xy(x: number, y: number) {
    const newX = (this._x !== x), newY = (this._y !== y);
    this._x = x, this._y = y;
    if (newX) this.newX();
    if (newY) this.newY();
    if (newX || newY) this.newPos();
  }

  abstract get innerWidth(): number;
  abstract get innerHeight(): number;

  private _minWidth = 0;
  get minWidth(): number { 
    return this._minWidth; 
  }
  set minWidth(minWidth: number) {
    if (this.minWidth === minWidth) return;
    this._minWidth = minWidth;
    this.newMinWidth();
  }
  protected newMinWidth() { }

  private _minHeight = 0;
  get minHeight(): number { 
    return this._minHeight;  
  };
  set minHeight(minHeight: number) {
    if (this._minHeight === minHeight) return;
    this._minHeight = minHeight;
    this.newMinHeight();
  }
  protected newMinHeight() { }

  private _content?: T;
  set content(content: T | undefined) {
    if (this._content === content) return;
    this._content = content;
    this.newContent();
  }
  get content(): T | undefined { return this._content; };
  protected newContent() {}

  abstract redraw(): void;
  stop(shouldRedrawToDefault?: boolean) { }
  isInArea(x: number, y: number) {
    return x >= this._startX && x <= this._endX && y >= this._startY && y <= this._endY;
  }
}

export default abstract class AbstractButton<TContent, TCacheX, TCacheY, TSize extends Size> extends ButtonLike<TContent> {
  constructor(ctx: CTX) {    
    super(ctx);
  }

  protected abstract calcContentSize(): TSize;
  protected abstract calcContentCacheX(): TCacheX;
  protected abstract calcContentCacheY(): TCacheY;
  protected abstract drawer(): void;

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

  protected newContent(): void {
    this.contentSize = this.calcContentSize();
  }
  
  private _contentSize?: TSize;
  protected get contentSize(): TSize {
    if (this._contentSize === undefined) return this.calcContentSize();
    else return this._contentSize;
  }
  private set contentSize(contentSize: TSize) {
    const oldContentSize = this._contentSize;
    this._contentSize = contentSize;
    if (!oldContentSize || oldContentSize.width !== contentSize.width) {
      this.width = Math.max(this.minWidth, contentSize.width + settings.gui.button.padding * 2);
      this._contentCacheX = this.calcContentCacheX();
    }
    if (!oldContentSize || oldContentSize.height !== contentSize.height) {
      this.height = Math.max(this.minHeight, contentSize.height + settings.gui.button.padding * 2);
      this._contentCacheY = this.calcContentCacheY();
    }
  }
  get innerWidth() {
    if (this.contentSize === undefined) return 0;
    else return this.contentSize.width + settings.gui.button.padding * 2;
  }
  get innerHeight() {
    if (this.contentSize === undefined) return 0;
    else return this.contentSize.height + settings.gui.button.padding * 2;
  }
  private _contentCacheX: TCacheX;
  protected get contentCacheX() {
    return this._contentCacheX;
  }
  private _contentCacheY: TCacheY;
  protected get contentCacheY() {
    return this._contentCacheY;
  }
  
  protected newWidth(width: number): void {
    super.newWidth(width);
    this.hoverManager?.update();
  }
  static calcWidth(contentWidth: number, minWidth = 0) {
    return Math.max(contentWidth + settings.gui.button.padding * 2, minWidth);
  }
  protected newMinWidth(): void {
    this.width = AbstractButton.calcWidth(this.contentSize?.width || 0, this.minWidth);
  }

  protected newHeight(height: number): void {
    super.newHeight(height);
    this.hoverManager?.update();
  }
  static calcHeight(contentHeight: number, minHeight = 0) {
    return Math.max(contentHeight + settings.gui.button.padding * 2, minHeight);
  }
  protected newMinHeight(): void {
    this.height = AbstractButton.calcHeight(this.contentSize?.height || 0, this.minHeight);
  }

  protected newX(): void {
    super.newX();
    this._contentCacheX = this.calcContentCacheX();
  }
  protected newY(): void {
    super.newY();
    this._contentCacheY = this.calcContentCacheY();
  }
  protected newPos(): void {
    this.hoverManager?.update();
  }

  setContentWithSizeChangeCheck(content: TContent) {
    const oldWidth = this.width, oldHeight = this.height;
    this.content = content;
    return (oldWidth !== this.width || oldHeight !== this.height);
  }

  protected hoverManager?: HoverManager;
  protected clickManager?: ClickManager;
  
  private redrawBorder() {
    this.ctx.ctx.fillStyle = settings.colors.bg;
    this.ctx.drawRoundedRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, settings.gui.button.rounding);
    this.ctx.ctx.fillStyle = settings.colors.button.bg;
    this.ctx.drawRoundedBorder(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, settings.gui.button.rounding);
  }
  private redrawLabel() {
    if (this?.bgColor) {
      this.ctx.ctx.fillStyle = this.bgColor;
    } else if (this?._disabled) {
      this.ctx.ctx.fillStyle = settings.colors.button.disabled;
    } else {
      this.ctx.ctx.fillStyle = settings.colors.button.bg;
    }
    this.ctx.ctx.fillRect(this._startX, this._startY, this.width, this.height);
    this.drawer();
  }
  private redrawContent() {
    if (this?.bgColor) {
      this.ctx.ctx.fillStyle = this.bgColor;
    } else if (this?._disabled) {
      this.ctx.ctx.fillStyle = settings.colors.button.disabled;
    } else if (this.clickManager?.isPressed()) {
      this.ctx.ctx.fillStyle = settings.colors.button.pressed;
    } else if (this.hoverManager?.isInArea()) {
      this.ctx.ctx.fillStyle = settings.colors.button.hover;
    } else {
      this.ctx.ctx.fillStyle = settings.colors.button.bg;
    }
    if (this.hoverManager?.isInArea() && !this?._disabled) {
      this.ctx.ctx.canvas.style.cursor = "pointer";
    } else {
      this.ctx.ctx.canvas.style.cursor = "default";
    }
    this.ctx.drawRoundedRect(this._startX, this._startY, this.width, this.height, settings.gui.button.rounding);
    this.drawer();
  }
  private updateManagers() {
    if (this?.justBorder || this?._invisible || this?._disabled || this?._likeLabel || !this?.onClick) {
      this.hoverManager?.stop();
      this.hoverManager = undefined;
      this.clickManager?.stop();
      this.clickManager = undefined;
    } else {
      this.hoverManager ||= this.ctx.hoverEvent.then({
        isInArea: (x, y) => this.isInArea(x, y),
        onHover: () => this.redraw(),
        onLeave: () => this.redraw(),
      });
      this.clickManager ||= this.ctx.clickEvent.then({
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
    super.stop();
    this.clickManager?.stop();
    this.clickManager = undefined;
    this.hoverManager?.stop();
    this.hoverManager = undefined;
    if (shouldRedrawToDefault) this.redraw();
  }
}
