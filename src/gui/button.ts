import { buttonColor, textColor } from "../game";
import { saveOldStyles } from "./utils";

const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  const loadOldStyles = saveOldStyles(ctx);
  
  ctx.fillStyle = buttonColor;
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

  loadOldStyles();
}

const additionalButtonHeight = 7;
const drawButton = (ctx: CanvasRenderingContext2D, x: number, y: number, text: string, width: number) => {
  const loadOldStyles = saveOldStyles(ctx);

  const textPx = 15;
  ctx.font = `${textPx}px serif`;
  ctx.fillStyle = textColor;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  const buttonX = (x - width / 2), buttonY = (y - textHeight / 2 - additionalButtonHeight / 2);
  const textX = (x - textWidth / 2), textY = (y + textHeight / 2);
  drawRoundedRect(ctx, buttonX, buttonY, width, textHeight + additionalButtonHeight, 4);
  ctx.fillText(text, textX, textY);
  alert(`${textX}, ${textY}, ${ctx.canvas.clientWidth}, ${ctx.canvas.clientHeight}`);

  loadOldStyles();
}

export default drawButton;
