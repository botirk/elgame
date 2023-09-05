import settings from "../../settings";
import CTX from "../CTX";

interface ScrollRequest {
  oneStep: number,
  maxHeight: () => number;
  dynamic: () => void;
};

export type ScrollManager = () => void;

export default class ScrollEvent {
  constructor(private readonly ctx: CTX) {
    this.wheelListener = this.wheelListener.bind(this);
    this.touchStartListener = this.touchStartListener.bind(this);
    this.touchMoveListener = this.touchMoveListener.bind(this);
    this.touchEndListener = this.touchEndListener.bind(this);
    ctx.ctx.canvas.addEventListener("wheel", this.wheelListener, { passive: false });
    ctx.ctx.canvas.addEventListener("touchstart", this.touchStartListener, { passive: true });
    ctx.ctx.canvas.addEventListener("touchmove", this.touchMoveListener, { passive: false });
    ctx.ctx.canvas.addEventListener("touchend", this.touchEndListener);
  }

  then(req: ScrollRequest): ScrollManager {
    this._pos = 0;
    this.oneStep = req.oneStep;
    this.atTop = true;
    this.atBot = false;
    this.req = req;
    this.maxHeight = this.req.maxHeight();
    const removeRequest = () => {
      if (this.req === req) this.req = undefined;
    }
    return removeRequest;
  }

  redraw() {
    if (this.hideTimeout === undefined) return;
    this.draw();
  }

  private showScroll() {
    this.startHiding();
    this.draw();
  }

  private draw() {
    const pagePercent = this.ctx.ctx.canvas.height / this._maxHeight;
    if (pagePercent >= 1) return;
    const heightPercent = this.pos / this.maxPos();
    const scrollHeight = this.ctx.ctx.canvas.height * pagePercent;
    const scrollPos = (this.ctx.ctx.canvas.height - scrollHeight) * heightPercent;
    this.ctx.ctx.fillStyle = settings.colors.button.bg;
    this.ctx.ctx.fillRect(this.ctx.ctx.canvas.width - settings.gui.scroll.width - settings.gui.scroll.padding, scrollPos, settings.gui.scroll.width, scrollHeight);
  }

  private startHiding() {
    clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(() => { this.hideTimeout = undefined; this.ctx.redraw(); }, settings.gui.scroll.timeout);
  }

  stop() {
    this.ctx.ctx.canvas.removeEventListener("wheel", this.wheelListener);
    this.ctx.ctx.canvas.removeEventListener("touchstart", this.touchStartListener);
    this.ctx.ctx.canvas.removeEventListener("touchmove", this.touchMoveListener);
    this.ctx.ctx.canvas.removeEventListener("touchend", this.touchEndListener);
    clearTimeout(this.hideTimeout);
  }

  private oneStep = 0;
  private _maxHeight = 0;
  private get maxHeight() { return this._maxHeight; }
  private set maxHeight(maxHeight: number) {
    this._maxHeight = maxHeight;
    this.pos = Math.min(this.maxPos(), this._pos);
  }

  private req?: ScrollRequest;
  private _pos = 0;
  private set pos(curPos: number) {
    if (this._pos === curPos) return;
    this._pos = curPos;
    if (this.req) {
      this.req.dynamic();
      this.startHiding();
      // already there is scroll(incorrect position), need whole redraw of scene
      if (this.hideTimeout) this.ctx.redraw(); // ctx will redraw whole scene which will redraw the scroll
      // there is no scroll, can draw on top
      else this.draw();
    }
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
  get pos() {
    return this._pos;
  }

  private atTop: boolean;
  private atBot: boolean;
  
  private botTouch?: number;
  private topTouch?: number;
  private hideTimeout?: NodeJS.Timeout;

  private maxPos() {
    return Math.max(0, this._maxHeight - this.ctx.ctx.canvas.height);
  }
  private wheelListener(e: WheelEvent) {
    // to top
    if (e.deltaY < 0) this.pos = Math.max(0, this.pos - this.oneStep);
    // to bot
    else if (e.deltaY > 0) this.pos = Math.min(this.maxPos(), this.pos + this.oneStep);
    // prevent
    if (!this.atTop && !this.atBot) e.preventDefault();
  }
  private touchStartListener(e: TouchEvent) {
    if (!e.targetTouches.length) return;
    this.topTouch = Infinity, this.botTouch = -Infinity;
    for (let i = 0; i < e.targetTouches.length; i++) {
      const [_, y] = settings.calculate.toCanvasCoords(this.ctx.ctx, e.targetTouches[i].pageX, e.targetTouches[i].pageY);
      if (y < this.topTouch) this.topTouch = y;
      if (y > this.botTouch) this.botTouch = y;
    }
  }
  private touchMoveListener(e: TouchEvent) {
    if (!this.topTouch || !this.botTouch || !e.targetTouches.length) return;
    const oldPos = this.pos;
    let topTouch = Infinity, botTouch = -Infinity;
    for (let i = 0; i < e.targetTouches.length; i++) {
      const [_, y] = settings.calculate.toCanvasCoords(this.ctx.ctx, e.targetTouches[i].pageX, e.targetTouches[i].pageY);
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
}
