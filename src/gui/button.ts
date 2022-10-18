import { InitSettings } from "..";
import settings from "../settings";
import button from "./events/button";
import drawRoundedRect from "./roundedRect";

const drawButton = (is: InitSettings, onClick: () => void, x: number, y: number, text: string, width: number): 
                   [(shouldRedraw: boolean) => void, () => void] => {
  is.ctx.font = settings.fonts.ctxFont;
  const metrics = is.ctx.measureText(text);

  const textWidth = metrics.width;
  const textHeight = settings.fonts.fontSize;
  const additionalButtonHeight = 5 + settings.gui.button.padding;
  const buttonX = (x - width / 2), buttonY = (y - textHeight / 3 - additionalButtonHeight / 2);
  const textX = (x - textWidth / 2), textY = (y + textHeight / 2);
  const isInArea = (x: number, y: number) => x >= buttonX && x <= buttonX + width && y >= buttonY && y <= buttonY + textHeight + additionalButtonHeight;

  const state = { isHover: false, isPressed: false };
  const redraw = () => {
    is.ctx.font = settings.fonts.ctxFont;
    if (state.isPressed) {
      is.ctx.fillStyle = settings.colors.button.pressed;
    }
    if (!state.isHover) {
      if (!state.isPressed) is.ctx.fillStyle = settings.colors.button.bg;
      is.ctx.canvas.style.cursor = "default";
    } else {
      if (!state.isPressed) is.ctx.fillStyle = settings.colors.button.hover;
      is.ctx.canvas.style.cursor = "pointer";
    }
    drawRoundedRect(is.ctx, buttonX, buttonY, width, textHeight + additionalButtonHeight, settings.gui.button.rounding);
    is.ctx.fillStyle = settings.colors.textColor;
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
  return [stopDrawing, redraw];
}

export const drawIcon = (is: InitSettings, x: number, y: number, img: HTMLImageElement) => {
  is.ctx.drawImage(img, x, y, img.width, img.height);
}

export const drawIconButton = (is: InitSettings, img: HTMLImageElement, x: number, y: number, onClick: () => void, onRedraw: () => void): 
                              [(shouldRedraw: boolean) => void, () => void, (xTo: number, yTo: number) => void] => {
  const isInArea = (xA: number, yA: number) => xA >= x && xA <= x + img.width && yA >= y && yA <= y + img.height;

  const state = { isHover: false, isPressed: false };
  const redraw = () => {
    drawIcon(is, x, y, img);
  };
  redraw();
  const stopHover = is.addHoverRequest({
    isInArea,
    onHover: () => { state.isHover = true; is.ctx.canvas.style.cursor = "pointer"; },
    onLeave: () => { state.isHover = false; is.ctx.canvas.style.cursor = "default"; },
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

  const move = (xTo: number, yTo: number) => { x = xTo, y = yTo };
  return [stopDrawing, redraw, move];
}

export const drawFullscreenButton = (is: InitSettings, onRedraw: () => void): [(shouldRedraw: boolean) => void, () => void, () => void] => {
  let [stopDrawing, redraw, move]: [ReturnType<typeof drawIconButton>[0] | undefined, ReturnType<typeof drawIconButton>[1] | undefined, ReturnType<typeof drawIconButton>[2] | undefined] = [undefined, undefined, undefined];
  
  const display = () => {
    newStopDrawing(false);
    [stopDrawing, redraw, move] = drawIconButton(
      is, is.prepared.imgs.fullscreen.img, 
      is.ctx.canvas.width - is.prepared.imgs.fullscreen.img.width - 25, is.ctx.canvas.height - is.prepared.imgs.fullscreen.img.height - 25,
      () => {
        is.ctx.canvas.requestFullscreen();
        newStopDrawing(false);
        onRedraw();
        is.ctx.canvas.addEventListener("fullscreenchange", () => {
          if (!document.fullscreenElement) display();
        });
      },
      () => 0,
    );
  }
  

  const newStopDrawing = (shouldRedraw: boolean) => {
    if (stopDrawing) stopDrawing(shouldRedraw);
    stopDrawing = undefined;
    redraw = undefined;
    move = undefined;
  }
  const newRedraw = () => {
    if (redraw) redraw();
  }
  const newMove = () => {
    if (move)
      move(is.ctx.canvas.width - is.prepared.imgs.fullscreen.img.width - 25, is.ctx.canvas.height - is.prepared.imgs.fullscreen.img.height - 25);
  }
  
  display();
  return [newStopDrawing, newRedraw, newMove];
}

export default drawButton;
