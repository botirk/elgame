import settings from "../../settings";

type MoveRequest = (x: number, y: number) => void;

export default class MoveEvent {
  constructor(private readonly _ctx: CanvasRenderingContext2D) {
    this._mouseMove = this._mouseMove.bind(this);
    this._touchMove = this._touchMove.bind(this);
    _ctx.canvas.addEventListener("mousemove", this._mouseMove);
    _ctx.canvas.addEventListener("touchmove", this._touchMove);
  }

  then(req: MoveRequest) {
    this._reqs.push(req);
    const removeRequest = () => {
      const i = this._reqs.indexOf(req);
      if (i !== -1) this._reqs.splice(i, 1);
    }
    return removeRequest;
  }

  stop() {
    this._ctx.canvas.removeEventListener("mousemove", this._mouseMove);
    this._ctx.canvas.removeEventListener("touchmove", this._touchMove);
  }

  private _reqs: MoveRequest[] = [];
  private _mouseMove(e: MouseEvent) {
    const [x, y] = settings.calculate.toCanvasCoords(this._ctx, e.x, e.y);
    for (const req of this._reqs) req(x, y);
  }
  private _touchMove(e: TouchEvent) {
    const [x, y] = settings.calculate.toCanvasCoords(this._ctx, e.touches[0].pageX, e.touches[0].pageY);
    for (const req of this._reqs) req(x, y);
  }
}
