import { Init } from "../../init";
import settings from "../../settings";

export interface ScrollOptions {
  maxHeight: number,
  oneStep: number,
  redraw: () => void,
  update: () => void,
  saveId?: string,
}

class Scroll {
  constructor(init: Init, options: () => ScrollOptions) {
    this.beforeUnloadListener = this.beforeUnloadListener.bind(this);
    this.wheelListener = this.wheelListener.bind(this);
    this.touchStartListener = this.touchStartListener.bind(this);
    this.touchMoveListener = this.touchMoveListener.bind(this);
    this.touchEndListener = this.touchEndListener.bind(this);
    window.addEventListener("beforeunload", this.beforeUnloadListener);
    init.ctx.canvas.addEventListener("wheel", this.wheelListener);
    init.ctx.canvas.addEventListener("touchstart", this.touchStartListener);
    init.ctx.canvas.addEventListener("touchmove", this.touchMoveListener);
    init.ctx.canvas.addEventListener("touchend", this.touchEndListener);
    this.init = init;
    this.options = options;
    this.update();
  }

  private atTop: boolean;
  private atBot: boolean;
  private init: Init;
  private options: () => ScrollOptions;
  private optionsSaved: ScrollOptions;
  
  private botTouch?: number;
  private topTouch?: number;
  private hideTimeout?: NodeJS.Timeout;

  private _pos: number;
  private set pos(curPos: number) {
    if (this._pos === curPos) return;
    this._pos = curPos;
    this.optionsSaved.update();
    this.optionsSaved.redraw();
    this.drawScroll();
    if (this._pos === this.maxPos()) {
      this.atBot = true;
      this.atTop = false;
    } else if (this._pos === 0) {
      this.atTop = true;
      this.atBot = false;
    } else {
      this.atTop = false;
      this.atBot = false;
    }
  }
  public get pos() {
    return this._pos;
  }

  private loadPoses(): { [saveId: string]: number } {
    const saveJSON = localStorage.getItem(settings.localStorage.scroll);
    if (saveJSON) {
      const parsed = JSON.parse(saveJSON);
      if (typeof(parsed) == "object") {
        if (!Object.values(parsed).some((key) => typeof(key) !== "number")) {
          return parsed;
        }
      }
    }
    return {};
  }
  private loadPos() {
    if (!this.optionsSaved.saveId) this._pos = 0;
    else this._pos = this.loadPoses()[this.optionsSaved.saveId] || 0;
  }
  private savePos(): boolean {
    if (!this.optionsSaved.saveId) return true;
    const loaded = this.loadPoses();
    loaded[this.optionsSaved.saveId] = this.pos;
    try {
      localStorage.setItem(settings.localStorage.scroll, JSON.stringify(loaded));
      return true;
    } catch {
      try {
        localStorage.removeItem(settings.localStorage.scroll);
        localStorage.setItem(settings.localStorage.scroll, JSON.stringify(loaded));
        return true;
      } catch {
        return false;
      }
      
    }
    
  }
  private maxPos() {
    return Math.max(0, this.optionsSaved.maxHeight - this.init.ctx.canvas.height);
  }
  private wheelListener(e: WheelEvent) {
    const oldPos = this.pos;
    // to top
    if (e.deltaY < 0) this.pos = Math.max(0, this.pos - this.optionsSaved.oneStep);
    // to bot
    else if (e.deltaY > 0) this.pos = Math.min(this.maxPos(), this.pos + this.optionsSaved.oneStep);
    // prevent
    if (!this.atTop && !this.atBot) e.preventDefault();
  }
  private touchStartListener(e: TouchEvent) {
    if (!e.targetTouches.length) return;
    this.topTouch = Infinity, this.botTouch = -Infinity;
    for (let i = 0; i < e.targetTouches.length; i++) {
      const [_, y] = settings.calculate.toCanvasCoords(this.init.ctx, e.targetTouches[i].pageX, e.targetTouches[i].pageY);
      if (y < this.topTouch) this.topTouch = y;
      if (y > this.botTouch) this.botTouch = y;
    }
  }
  private touchMoveListener(e: TouchEvent) {
    if (!this.topTouch || !this.botTouch || !e.targetTouches.length) return;
    const oldPos = this.pos;
    let topTouch = Infinity, botTouch = -Infinity;
    for (let i = 0; i < e.targetTouches.length; i++) {
      const [_, y] = settings.calculate.toCanvasCoords(this.init.ctx, e.targetTouches[i].pageX, e.targetTouches[i].pageY);
      if (y < topTouch) topTouch = y;
      if (y > botTouch) botTouch = y;
    }
    // to top
    if (botTouch > this.botTouch) {
      this.pos = Math.max(0, this.pos - (botTouch - this.botTouch));
    }
    // to bot
    if (topTouch < this.topTouch) {
      this.pos = Math.min(this.maxPos(), this.pos + (this.topTouch - topTouch));
    }
    this.botTouch = botTouch;
    this.topTouch = topTouch;
    // prevent
    if (!this.atTop && !this.atBot) e.preventDefault();
  }
  private touchEndListener(e: TouchEvent) {
    this.topTouch = undefined, this.botTouch = undefined;
  }
  private beforeUnloadListener(e: BeforeUnloadEvent) {
    this.savePos();
  }

  update() {
    this.optionsSaved = this.options();
    if (!this._pos) this.loadPos();
    this._pos = Math.min(this.maxPos(), this._pos);
  }
  drawScroll() {
    const pagePercent = this.init.ctx.canvas.height / this.optionsSaved.maxHeight;
    if (pagePercent >= 1) return;
    const heightPercent = this.pos / this.maxPos();
    const scrollHeight = this.init.ctx.canvas.height * pagePercent;
    const scrollPos = (this.init.ctx.canvas.height - scrollHeight) * heightPercent;
    this.init.ctx.fillStyle = settings.colors.button.bg;
    this.init.ctx.fillRect(this.init.ctx.canvas.width - settings.gui.scroll.width - settings.gui.scroll.padding, scrollPos, settings.gui.scroll.width, scrollHeight);
    clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(() => { this.optionsSaved.redraw(); this.hideTimeout = undefined; }, settings.gui.scroll.timeout);
  }
  stop() {
    window.removeEventListener("beforeunload", this.beforeUnloadListener);
    this.init.ctx.canvas.removeEventListener("wheel", this.wheelListener);
    this.init.ctx.canvas.removeEventListener("touchstart", this.touchStartListener);
    this.init.ctx.canvas.removeEventListener("touchmove", this.touchMoveListener);
    this.init.ctx.canvas.removeEventListener("touchend", this.touchEndListener);
    clearTimeout(this.hideTimeout);
    this.savePos();
  }
}

export default Scroll;