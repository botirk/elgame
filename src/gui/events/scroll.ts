import settings from "../../settings";

interface ScrollRequest {
  update?: () => void;
  redraw?: () => void;
};

export default class ScrollEvent {
  constructor(private readonly _ctx: CanvasRenderingContext2D) {
    this.wheelListener = this.wheelListener.bind(this);
    this.touchStartListener = this.touchStartListener.bind(this);
    this.touchMoveListener = this.touchMoveListener.bind(this);
    this.touchEndListener = this.touchEndListener.bind(this);
    _ctx.canvas.addEventListener("wheel", this.wheelListener, { passive: false });
    _ctx.canvas.addEventListener("touchstart", this.touchStartListener, { passive: true });
    _ctx.canvas.addEventListener("touchmove", this.touchMoveListener, { passive: false });
    _ctx.canvas.addEventListener("touchend", this.touchEndListener);
  }

  then(req: ScrollRequest) {
    this._reqs.push(req);
    const removeRequest = () => {
      const i = this._reqs.indexOf(req);
      if (i !== -1) this._reqs.splice(i, 1);
    }
    return removeRequest;
  }

  newScene(maxHeight = 0, oneStep = 0) {
    clearTimeout(this.hideTimeout);
    this.hideTimeout = undefined;
    this._pos = 0;
    this._maxHeight = maxHeight;
    this.oneStep = oneStep;
  }

  drawScroll() {
    const pagePercent = this._ctx.canvas.height / this._maxHeight;
    if (pagePercent >= 1) return;
    const heightPercent = this.pos / this.maxPos();
    const scrollHeight = this._ctx.canvas.height * pagePercent;
    const scrollPos = (this._ctx.canvas.height - scrollHeight) * heightPercent;
    this._ctx.fillStyle = settings.colors.button.bg;
    this._ctx.fillRect(this._ctx.canvas.width - settings.gui.scroll.width - settings.gui.scroll.padding, scrollPos, settings.gui.scroll.width, scrollHeight);
    clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(() => { for (const req of this._reqs) req.redraw?.(); this.hideTimeout = undefined; }, settings.gui.scroll.timeout);
  }

  stop() {
    this._ctx.canvas.removeEventListener("wheel", this.wheelListener);
    this._ctx.canvas.removeEventListener("touchstart", this.touchStartListener);
    this._ctx.canvas.removeEventListener("touchmove", this.touchMoveListener);
    this._ctx.canvas.removeEventListener("touchend", this.touchEndListener);
    clearTimeout(this.hideTimeout);
  }

  oneStep = 0;
  _maxHeight = 0;
  get maxHeight() { return this._maxHeight; }
  set maxHeight(maxHeight: number) {
    this._maxHeight = maxHeight;
    this.pos = Math.min(this.maxPos(), this._pos);
  }

  private _reqs: ScrollRequest[] = [];
  private _pos = 0;
  private set pos(curPos: number) {
    if (this._pos === curPos) return;
    this._pos = curPos;
    for (const req of this._reqs) req.update?.();
    for (const req of this._reqs) req.redraw?.();
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
  get pos() {
    return this._pos;
  }

  private atTop: boolean;
  private atBot: boolean;
  
  private botTouch?: number;
  private topTouch?: number;
  private hideTimeout?: NodeJS.Timeout;

  private maxPos() {
    return Math.max(0, this._maxHeight - this._ctx.canvas.height);
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
      const [_, y] = settings.calculate.toCanvasCoords(this._ctx, e.targetTouches[i].pageX, e.targetTouches[i].pageY);
      if (y < this.topTouch) this.topTouch = y;
      if (y > this.botTouch) this.botTouch = y;
    }
  }
  private touchMoveListener(e: TouchEvent) {
    if (!this.topTouch || !this.botTouch || !e.targetTouches.length) return;
    const oldPos = this.pos;
    let topTouch = Infinity, botTouch = -Infinity;
    for (let i = 0; i < e.targetTouches.length; i++) {
      const [_, y] = settings.calculate.toCanvasCoords(this._ctx, e.targetTouches[i].pageX, e.targetTouches[i].pageY);
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
