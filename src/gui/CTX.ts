import { Assets, loadAssets, loadWords } from "../asset";
import settings from "../settings";
import ButtonEvent from "./events/button";
import ClickEvent from "./events/click";
import HoverEvent from "./events/hover";
import MoveEvent from "./events/move";
import ResizeEvent from "./events/resize";
import ScrollEvent from "./events/scroll";
import BottomMenu from "./bottomMenu";
import Progress from "../progress";
import { UnloadedWord, Word } from "../games";

export default class CTX {
  private constructor(public readonly ctx: CanvasRenderingContext2D, public readonly assets: Assets, public readonly words: Word[]) {
    this.prepareCtx();
    this.scrollEvent = new ScrollEvent(this);
    this.bottomMenu = new BottomMenu(this);
    this.resizeEvent.then({ fix: () => this.prepareCtx(), redraw: () => this.redraw() });
  }
  static async aconstructor(ctx: CanvasRenderingContext2D, unloadedWords: UnloadedWord[]) {
    CTX.drawLoadingBackground(ctx);
    const assets = await loadAssets(settings.gui.icon.width, "width");
    const words = await loadWords(unloadedWords, settings.gui.icon.width);
    return new CTX(ctx, assets, words);
  }
  readonly loaded: Promise<void>;

  /** drawings */
  innerRedraw?: () => void;
  outerRedraw() {
    this.scrollEvent.redraw();
    this.bottomMenu.redraw();
  }
  redraw() {
    this.innerRedraw?.();
    this.outerRedraw();
  }
  
  centerX() { return this.ctx.canvas.width / 2; }
  centerY() { return this.ctx.canvas.height / 2; }
  center(): [number, number] { return [this.centerX(), this.centerY()]; }

  drawIcon(x: number, y: number, img: HTMLImageElement) {
    this.ctx.drawImage(img, x, y, img.width, img.height);
  }

  static drawBackground(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = settings.colors.bg;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
  drawBackground() {
    CTX.drawBackground(this.ctx);
  }

  drawRoundedRect(x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x+r, y);
    this.ctx.arcTo(x+w, y,   x+w, y+h, r);
    this.ctx.arcTo(x+w, y+h, x,   y+h, r);
    this.ctx.arcTo(x,   y+h, x,   y,   r);
    this.ctx.arcTo(x,   y,   x+w, y,   r);
    this.ctx.closePath();
    this.ctx.fill();
  }
  
  drawRoundedBorder(x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x+r, y);
    this.ctx.arcTo(x+w, y,   x+w, y+h, r);
    this.ctx.arcTo(x+w, y+h, x,   y+h, r);
    this.ctx.arcTo(x,   y+h, x,   y,   r);
    this.ctx.arcTo(x,   y,   x+w, y,   r);
    this.ctx.closePath();
    this.ctx.stroke();
  }
  
  
  static drawLoadingBackground(ctx: CanvasRenderingContext2D) {
    CTX.drawBackground(ctx);
    ctx.fillStyle = settings.colors.textColor;
    CTX.drawTextAtCenter(ctx, ctx.canvas.width / 2, ctx.canvas.height / 2, "...");
  }
  drawLoadingBackground() {
    this.drawBackground();
    this.ctx.fillStyle = settings.colors.textColor;
    this.drawTextAtCenter(...this.center(), "...");
  }

  static drawTextAtCenter(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
    const metrics = ctx.measureText(text);
  
    const textWidth = metrics.width;
    const textHeight = settings.fonts.fontSize;
    const textX = (x - textWidth / 2), textY = (y + textHeight / 2);
    ctx.fillText(text, textX, textY);
  }
  drawTextAtCenter = (x: number, y: number, text: string) => {
    CTX.drawTextAtCenter(this.ctx, x, y, text);
  }
  
  calcTextWidth = (text: string) => {
    return this.ctx.measureText(text).width;
  }

  // cached settings
  private _isMobile: boolean;
  get isMobile() { return this._isMobile; }
  private _gameWidth: number;
  get gameWidth() { return this._gameWidth; }
  private _gameX: number;
  get gameX() { return this._gameX; }
  private _gameXMax: number;
  get gameXMax() { return this._gameXMax; }
  private _verticalSpeedMultipiler: number;
  get verticalSpeedMultiplier() { return this._verticalSpeedMultipiler; }
  private prepareCtx() {
    // set height to fixed
    {
        const ratio = settings.dimensions.heigth / this.ctx.canvas.clientHeight;
        this.ctx.canvas.width = this.ctx.canvas.clientWidth * ratio;
        this.ctx.canvas.height = this.ctx.canvas.clientHeight * ratio;
    }
    // fix width
    const currentWidthToHeightRatio = this.ctx.canvas.width / this.ctx.canvas.height;
    if (currentWidthToHeightRatio < settings.dimensions.widthToHeightRatio) {
        this.ctx.canvas.width = this.ctx.canvas.height * settings.dimensions.widthToHeightRatio;
    }
    // add shadow
    this.ctx.shadowColor = "black";
    this.ctx.shadowBlur = 1;
    // set font
    this.ctx.font = settings.fonts.ctxFont;

    // cache
    this._isMobile = settings.calculate.isMobile(this.ctx);
    this._gameWidth = settings.calculate.gameWidth(this._isMobile);
    this._gameX = settings.calculate.gameX(this.ctx, this._gameWidth);
    this._gameXMax = settings.calculate.gameXMax(this.ctx, this._gameWidth);
    this._verticalSpeedMultipiler = this._isMobile ? 1 : 1.33;
  }
  
  // events
  readonly buttonEvent = new ButtonEvent();
  readonly clickEvent = new ClickEvent(this.ctx);
  readonly hoverEvent = new HoverEvent(this.ctx);
  readonly moveEvent  = new MoveEvent(this.ctx);
  readonly resizeEvent = new ResizeEvent(this.ctx);
  readonly scrollEvent: ScrollEvent;
  // fullscreen button
  readonly bottomMenu: BottomMenu;
  // progress
  readonly progress = new Progress(this);

  stop() {
    this.buttonEvent.stop();
    this.clickEvent.stop();
    this.hoverEvent.stop();
    this.moveEvent.stop();
    this.resizeEvent.stop();
    this.scrollEvent.stop();
  }
}
