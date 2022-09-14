import { InitSettings } from "../settings";
import drawText from "./text";
import { saveOldStyles } from "./utils";

const drawRoundedRect = (is: InitSettings, x: number, y: number, w: number, h: number, r: number, isDefaultStyle ?: boolean) => {
  const loadOldStyles = saveOldStyles(is.ctx);
  
  if (isDefaultStyle) is.ctx.fillStyle = is.buttonColor;
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

  loadOldStyles();
}

const drawButton = (is: InitSettings, x: number, y: number, text: string, width: number, hover ?: boolean) => {
  const loadOldStyles = saveOldStyles(is.ctx);

  is.ctx.fillStyle = is.buttonColor;
  if (hover) is.ctx.fillStyle = is.hoverColor;
  is.ctx.font = is.ctxFont;
  const metrics = is.ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  const buttonX = (x - width / 2), buttonY = (y - textHeight / 2 - is.additionalButtonHeight / 2);
  const textX = (x - textWidth / 2), textY = (y + textHeight / 2);
  drawRoundedRect(is, buttonX, buttonY, width, textHeight + is.additionalButtonHeight, 4);
  drawText(is, textX, textY, text);
  
  const [promise] = is.addHoverRequest((x, y) => x >= buttonX && x <= buttonX + width && y >= buttonY && y <= buttonY + textHeight + is.additionalButtonHeight, !hover);
  promise.then(() => {
    drawButton(is, x, y, text, width, !hover);
    //alert("SUCCESS!");
    //is.ctx.fillRect(0,0, 300, 300);
  });

  loadOldStyles();
}

export default drawButton;
