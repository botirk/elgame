import settings from "../../settings";

interface ButtonRequest {
  button: string,
  onReleased: () => void,
  onPressed?: () => void,
};

export default class ButtonEvent {
  constructor() {
    this.keyDown = this.keyDown.bind(this);
    this.keyUp = this.keyUp.bind(this);
    document.addEventListener("keydown", this.keyDown);
    document.addEventListener("keyup", this.keyUp);
  }

  then(req: ButtonRequest) {
    this._reqs.push(req);
    const removeRequest = () => {
      const i = this._reqs.indexOf(req);
      if (i !== -1) this._reqs.splice(i, 1);
    }
    return removeRequest;
  }

  stop() {
    document.removeEventListener("keydown", this.keyDown);
    document.removeEventListener("keyup", this.keyUp);
  }

  private _reqs: ButtonRequest[] = [];
  private keyDown(e: KeyboardEvent) {
    this._reqs.forEach((req) => { if (req.button == e.key) req.onPressed?.(); });
  }
  private keyUp(e: KeyboardEvent) {
    this._reqs.forEach((req) => { if (req.button == e.key) req.onReleased(); });
  }
}
