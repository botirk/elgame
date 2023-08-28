import settings from "../settings";

interface ClickRequest {
  isInArea: (x: number, y: number) => boolean,
  isPressed?: boolean,
  onReleased: (isInside: boolean) => void,
  onPressed?: () => void,
  zIndex?: number,
}

class CTX {
  constructor(public readonly ctx: CanvasRenderingContext2D) {
    this.prepareCtx();
    this.prepareResize();
    this.prepareClick();
    // check resize
    this.resize(() => this.prepareCtx());
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
  
  // resize
  private resizeObserver: ResizeObserver;
  private resizeCBs: Array<() => void> = [];
  private resize(cb: () => void) {
    this.resizeCBs.push(cb);
    return () => {
      const i = this.resizeCBs.indexOf(cb);
      if (i !== -1) this.resizeCBs.splice(i);
    }
  }
  private prepareResize() {
    this.resizeObserver = new ResizeObserver(() => this.resizeCBs.forEach((v) => v()));
    this.resizeObserver.observe(this.ctx.canvas);
  }
  private quitResize() {
    this.resizeObserver.disconnect();
  }
  // click
  private clickCBs: ClickRequest[] = [];
  private mouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    const [x, y] = settings.calculate.toCanvasCoords(this.ctx, e.x, e.y);
    const result: ClickRequest[] = [];
    let resultZIndex = -Infinity;
    this.clickCBs.forEach((requester) => {
      if (requester.isInArea(x, y)) {
        if ((requester.zIndex || 0) >= resultZIndex) {
          if ((requester.zIndex || 0) > resultZIndex) {
            resultZIndex = (requester.zIndex || 0);
            result.length = 0;
          }
          result.push(requester);
        }
      }
    });
    result.forEach((requester) => {
      requester.isPressed = true;
      requester.onPressed?.();
    });
  }
  private mouseUp(e: MouseEvent) {
    const [x, y] = settings.calculate.toCanvasCoords(this.ctx, e.x, e.y);
    this.clickCBs.forEach((requester) => {
      if (requester.isPressed) {
        requester.isPressed = false;
        requester.onReleased(requester.isInArea(x, y));
      }
    });
  }
  private click(cb: ClickRequest) {
    this.clickCBs.push(cb);
    return () => {
      const i = this.clickCBs.indexOf(cb);
      if (i !== -1) this.clickCBs.splice(i);
    }
  }
  private prepareClick() {
    this.mouseDown = this.mouseDown.bind(this);
    this.mouseUp = this.mouseUp.bind(this);
    this.ctx.canvas.addEventListener("mouseup", this.mouseUp);
    this.ctx.canvas.addEventListener("mousedown", this.mouseDown);
  }
  private quiteClick() {
    this.ctx.canvas.removeEventListener("mouseup", this.mouseUp);
    this.ctx.canvas.removeEventListener("mousedown", this.mouseDown);
  }
}


