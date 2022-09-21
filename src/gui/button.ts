import { InitSettings } from "..";
import drawRoundedRect from "./roundedRect";

const drawButton = (is: InitSettings, onClick: () => void, x: number, y: number, text: string, width: number) => {
  is.ctx.font = is.fonts.ctxFont;
  const metrics = is.ctx.measureText(text);

  const textWidth = metrics.width;
  const textHeight = is.fonts.fontSize;
  const additionalButtonHeight = 5 + is.fonts.additionalButtonHeight;
  const buttonX = (x - width / 2), buttonY = (y - textHeight / 3 - additionalButtonHeight / 2);
  const textX = (x - textWidth / 2), textY = (y + textHeight / 2);
  const isInArea = (x: number, y: number) => x >= buttonX && x <= buttonX + width && y >= buttonY && y <= buttonY + textHeight + additionalButtonHeight;

  const state = { isHover: false, isPressed: false };
  const redraw = () => {
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
    is.ctx.fillStyle = is.colors.textColor;
    is.ctx.fillText(text, textX, textY);
  };
  redraw();
  const stopHover = is.addHoverRequest({
    isInArea, 
    onHover: () => { state.isHover = true; redraw(); },
    onLeave: () => { state.isHover = false; redraw(); },
  });
  const stopClick = is.addClickRequest({
    isInArea,
    onReleased: (isInArea) => { state.isPressed = false; redraw(); if (isInArea) onClick(); },
    onPressed: () => { state.isPressed = true; redraw(); },
  });

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
