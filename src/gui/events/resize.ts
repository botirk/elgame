
interface ResizeRequest {
  fix?: () => void;
  update?: () => void;
  redraw?: () => void;
};

export type ResizeManager = () => void;

export default class ResizeEvent {
  constructor(ctx: CanvasRenderingContext2D) {
    this.onObserve = this.onObserve.bind(this);
    this._observer = new ResizeObserver(this.onObserve);
    this._observer.observe(ctx.canvas);
  }

  private isFixing: boolean = false;
  private onObserve() {
    if (this.isFixing) return;
    else if (!this._init) this._init = true;
    else {
      this.isFixing = true;
      for (const req of this._reqs) req.fix?.();
      this.isFixing = false;
      for (const req of this._reqs) req.update?.();
      for (const req of this._reqs) req.redraw?.();
    }
  }

  then(req: ResizeRequest): ResizeManager {
    this._reqs.push(req);
    const removeRequest = () => {
      const i = this._reqs.indexOf(req);
      if (i !== -1) this._reqs.splice(i, 1);
    }
    return removeRequest;
  }

  stop() {
    this._observer.disconnect();
  }

  private _init: boolean = false;
  private _observer: ResizeObserver;
  private _reqs: ResizeRequest[] = [];
}
