import settings from "../../settings";

interface ClickRequest {
  isInArea: (x: number, y: number) => boolean,
  isPressed?: boolean,
  onReleased: (isInside: boolean) => void,
  onPressed?: () => void,
  zIndex?: number,
}

export interface ClickManager {
  stop: () => void,
  isPressed: () => boolean,
}

export default class ClickEvent {
  constructor(private readonly _ctx: CanvasRenderingContext2D) {
    this._mouseDown = this._mouseDown.bind(this);
    this._mouseUp = this._mouseUp.bind(this);
    _ctx.canvas.addEventListener("mousedown", this._mouseDown);
    _ctx.canvas.addEventListener("mouseup", this._mouseUp);
  }

  then(req: ClickRequest): ClickManager {
    this._reqs.push(req);
    const stop = () => {
      const i = this._reqs.indexOf(req);
      if (i !== -1) this._reqs.splice(i, 1);
      req.isPressed = false;
    }
    const isPressed = () => !!req.isPressed;
    return { stop, isPressed };
  }

  stop() {
    this._ctx.canvas.removeEventListener("mousedown", this._mouseDown);
    this._ctx.canvas.removeEventListener("mouseup", this._mouseUp);
  }

  private _reqs: ClickRequest[] = [];
  private _mouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    const [x, y] = settings.calculate.toCanvasCoords(this._ctx, e.x, e.y);
    const result: ClickRequest[] = [];
    let resultZIndex = -Infinity;
    this._reqs.forEach((req) => {
      if (req.isInArea(x, y)) {
        if ((req.zIndex || 0) >= resultZIndex) {
          if ((req.zIndex || 0) > resultZIndex) {
            resultZIndex = (req.zIndex || 0);
            result.length = 0;
          }
          result.push(req);
        }
      }
    });
    result.forEach((requester) => {
      requester.isPressed = true;
      requester.onPressed?.();
    });
  }
  private _mouseUp(e: MouseEvent) {
    const [x, y] = settings.calculate.toCanvasCoords(this._ctx, e.x, e.y);
    this._reqs.forEach((req) => {
      if (req.isPressed) {
        req.isPressed = false;
        req.onReleased(req.isInArea(x, y));
      }
    });
  }
}
