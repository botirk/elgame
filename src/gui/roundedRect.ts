import { InitSettings } from "../settings";

const drawRoundedRect = (is: InitSettings, x: number, y: number, w: number, h: number, r: number) => {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  is.ctx.beginPath();
  is.ctx.moveTo(x+r, y);
  is.ctx.arcTo(x+w, y,   x+w, y+h, r);
  is.ctx.arcTo(x+w, y+h, x,   y+h, r);
  is.ctx.arcTo(x,   y+h, x,   y,   r);
  is.ctx.arcTo(x,   y,   x+w, y,   r);
  is.ctx.closePath();
  is.ctx.fill();
}

export default drawRoundedRect;
