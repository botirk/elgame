import settings from "../../settings";

interface HoverRequest {
  isInArea: (x: number, y: number) => boolean,
  onHover: () => void,
  onLeave: () => void,
  isCurrentlyInside?: boolean,
}

interface HoverRequestPlus extends HoverRequest {
  lastPos: [number, number],
}

export interface HoverManager {
  stop: () => void,
  update: () => void,
  isInArea: () => boolean,
}

export default class HoverEvent {
  constructor(private readonly _ctx: CanvasRenderingContext2D) {
    this._mouseMove = this._mouseMove.bind(this);
    this._ctx.canvas.addEventListener("mousemove", this._mouseMove);
  }

  then(req: HoverRequest): HoverManager {
    const newReq: HoverRequestPlus = { ...req, lastPos: [-Infinity, -Infinity] };
    this._reqs.push(newReq);
    
    const stop = () => {
      const i = this._reqs.indexOf(newReq);
      if (i !== -1) this._reqs.splice(i, 1);
      newReq.isCurrentlyInside = false;
    }
    const isInArea = () => !!newReq.isCurrentlyInside;
    const update = () => { newReq.isCurrentlyInside = newReq.isInArea(...newReq.lastPos); };

    return { stop, isInArea, update };
  }

  stop() {
    this._ctx.canvas.removeEventListener("mousemove", this._mouseMove);
  }

  private _reqs: HoverRequestPlus[] = [];
  private _mouseMove(e: MouseEvent) {
    const pos = settings.calculate.toCanvasCoords(this._ctx, e.x, e.y);
    this._reqs.forEach((req) => {
      req.lastPos = pos;
      if (!req.isCurrentlyInside && req.isInArea(...req.lastPos)) {
        req.isCurrentlyInside = true;
        req.onHover();
      } else if (req.isCurrentlyInside && !req.isInArea(...req.lastPos)) {
        req.isCurrentlyInside = false;
        req.onLeave();
      }
    });
  }
}
