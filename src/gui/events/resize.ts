
interface ResizeRequest {
  resize?: () => void;
  after?: () => void;
};

export type ResizeManager = () => void;

export default class ResizeEvent {
  constructor(_ctx: CanvasRenderingContext2D) {
    this._observer = new ResizeObserver(() => {
      if (!this._init) this._init = true;
      else {
        for (const req of this._reqs) req.resize?.();
        for (const req of this._reqs) req.after?.();
      }
    })
    this._observer.observe(_ctx.canvas);
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
