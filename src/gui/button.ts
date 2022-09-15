import { InitSettings } from "../settings";
import drawText from "./text";
import { saveOldStyles } from "./utils";

const drawRoundedRect = (is: InitSettings, x: number, y: number, w: number, h: number, r: number, isDefaultStyle ?: boolean) => {
  const loadOldStyles = saveOldStyles(is.ctx);
  
  if (isDefaultStyle) is.ctx.fillStyle = is.colors.buttonColor;
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

const drawButton = (is: InitSettings, onClick: () => void, x: number, y: number, text: string, width: number) => {
  const loadOldStyles = saveOldStyles(is.ctx);
  is.ctx.font = is.fonts.ctxFont;
  const metrics = is.ctx.measureText(text);
  loadOldStyles();

  const textWidth = metrics.width;
  const textHeight = is.fonts.fontSize;
  const additionalButtonHeight = 5 + is.fonts.additionalButtonHeight;
  const buttonX = (x - width / 2), buttonY = (y - textHeight / 3 - additionalButtonHeight / 2);
  const textX = (x - textWidth / 2), textY = (y + textHeight / 2);
  const isInArea = (x: number, y: number) => x >= buttonX && x <= buttonX + width && y >= buttonY && y <= buttonY + textHeight + additionalButtonHeight;

  const state = { isHover: false, isPressed: false };
  const redraw = () => {
    const loadOldStyles = saveOldStyles(is.ctx);

    is.ctx.font = is.fonts.ctxFont;
    if (state.isPressed) {
      is.ctx.fillStyle = is.colors.pressedColor;
    }
    if (!state.isHover) {
      if (!state.isPressed) is.ctx.fillStyle = is.colors.buttonColor;
      is.ctx.canvas.style.cursor = "default";
    } else {
      if (!state.isPressed) is.ctx.fillStyle = is.colors.hoverColor;
      is.ctx.canvas.style.cursor = "pointer";
    }
    drawRoundedRect(is, buttonX, buttonY, width, textHeight + additionalButtonHeight, 4);
    drawText(is, textX, textY, text);

    loadOldStyles();
  }
  redraw();

  
  const stopHover = is.addHoverRequest(isInArea, false, () => { state.isHover = true; redraw(); }, () => { state.isHover = false; redraw(); });
  const stopClick = is.addClickRequest(isInArea, (isInArea) => { state.isPressed = false; redraw(); if (isInArea) onClick(); }, () => { state.isPressed = true; redraw(); });

  const stopDrawing = (shouldRedrawToDefault?: boolean) => {
    if (shouldRedrawToDefault && (state.isHover || state.isPressed)) {
      state.isHover = false;
      state.isPressed = false;
      redraw();
    }
    stopHover();
    stopClick();
  }
  return stopDrawing;
}

export default drawButton;
