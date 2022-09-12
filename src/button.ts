
const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  const oldColor = ctx.fillStyle;
  
  ctx.fillStyle = "#FF0000";
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = oldColor;
}

export const drawButton = (ctx: CanvasRenderingContext2D, x: number, y: number, text: string) => {
  const metrics = ctx.measureText(text);
  const width = metrics.width;
  const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  const posX = (x - width / 2);
  const posY = (y - height / 2);

  drawRoundedRect(ctx, posX, posY, width, height, 5);
  ctx.fillText(text, posX, posY);
}