import { InitSettings } from "..";
import settings from "../settings";
import { drawRoundedRect } from "./roundedRect";
import { calcTextWidth } from "./text";

const drawButton = (is: InitSettings, onClick: () => void, x: number, y: number, text: string, optional?: { width?: number, height?: number, bgColor?: string }): 
                   [(shouldRedraw: boolean) => void, () => void, (xTo: number, yTo: number) => void] => {
  
  is.ctx.font = settings.fonts.ctxFont;
  const textWidth = calcTextWidth(is.ctx, text);
  const textHeight = settings.fonts.fontSize;
  const state = {
    width: optional?.width || textWidth + + settings.gui.button.padding * 2,
    height: optional?.height || textHeight + settings.gui.button.padding * 2,
    isHover: false, isPressed: false,
    buttonX: 0, buttonY: 0,
    textX: 0, textY: 0,
  };
  const move = (xTo: number, yTo: number) => {
    x = xTo, y = yTo;
    state.buttonX = (x - state.width / 2), state.buttonY = (y - state.height / 2);
    state.textX = (x - textWidth / 2), state.textY = (state.buttonY + state.height / 2 + textHeight / 3);
  }
  move(x, y);
  const isInArea = (x: number, y: number) => x >= state.buttonX && x <= state.buttonX + state.width && y >= state.buttonY && y <= state.buttonY + state.height;

  const redraw = () => {
    is.ctx.font = settings.fonts.ctxFont;
    if (optional?.bgColor) {
      is.ctx.fillStyle = optional.bgColor;
    } else if (state.isPressed) {
      is.ctx.fillStyle = settings.colors.button.pressed;
    }
    if (!state.isHover) {
      if (!state.isPressed && !optional?.bgColor) is.ctx.fillStyle = settings.colors.button.bg;
      is.ctx.canvas.style.cursor = "default";
    } else {
      if (!state.isPressed && !optional?.bgColor) is.ctx.fillStyle = settings.colors.button.hover;
      is.ctx.canvas.style.cursor = "pointer";
    }
    drawRoundedRect(is.ctx, state.buttonX, state.buttonY, state.width, state.height, settings.gui.button.rounding);
    is.ctx.fillStyle = settings.colors.textColor;
    is.ctx.fillText(text, state.textX, state.textY);
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
  return [stopDrawing, redraw, move];
}

export const drawIcon = (is: InitSettings, x: number, y: number, img: HTMLImageElement) => {
  is.ctx.drawImage(img, x, y, img.width, img.height);
}

export const drawIconButton = (is: InitSettings, onClick: () => void, x: number, y: number, img: HTMLImageElement, optional?: { width?: number, height?: number, bgColor?: string }): 
                              [(shouldRedraw: boolean) => void, () => void, (xTo: number, yTo: number) => void] => {

  const state = {
    width: optional?.width || img.width + settings.gui.button.padding * 2,
    height: optional?.height || img.height + settings.gui.button.padding * 2,
    isHover: false, isPressed: false,
    buttonX: 0, buttonY: 0,
    iconX: 0, iconY: 0,
  };
  const move = (xTo: number, yTo: number) => {
    x = xTo, y = yTo;
    state.buttonX = (x - state.width / 2), state.buttonY = (y - state.height / 2);
    state.iconX = (x - img.width / 2), state.iconY = (y - img.height / 2);
  };
  move(x, y);
  const isInArea = (x: number, y: number) => x >= state.buttonX && x <= state.buttonX + state.width && y >= state.buttonY && y <= state.buttonY + state.height;
  const redraw = () => {
    if (optional?.bgColor) {
      is.ctx.fillStyle = optional.bgColor;
    } else if (state.isPressed) {
      is.ctx.fillStyle = settings.colors.button.pressed;
    }
    if (!state.isHover) {
      if (!state.isPressed && !optional?.bgColor) is.ctx.fillStyle = settings.colors.button.bg;
      is.ctx.canvas.style.cursor = "default";
    } else {
      if (!state.isPressed && !optional?.bgColor) is.ctx.fillStyle = settings.colors.button.hover;
      is.ctx.canvas.style.cursor = "pointer";
    }
    drawRoundedRect(is.ctx, state.buttonX, state.buttonY, state.width, state.height, settings.gui.button.rounding);
    drawIcon(is, state.iconX, state.iconY, img);
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

  return [stopDrawing, redraw, move];
}

export const drawFullscreenButton = (is: InitSettings, onRedraw: () => void): [(shouldRedraw: boolean) => void, () => void, () => void] => {
  let [stopDrawing, redraw, move]: [ReturnType<typeof drawIconButton>[0] | undefined, ReturnType<typeof drawIconButton>[1] | undefined, ReturnType<typeof drawIconButton>[2] | undefined] = [undefined, undefined, undefined];
  const x = () => is.ctx.canvas.width - is.prepared.imgs.fullscreen.img.width / 2 - settings.gui.button.padding - 15;
  const y = () => is.ctx.canvas.height - is.prepared.imgs.fullscreen.img.height / 2 - settings.gui.button.padding - 15;

  const display = () => {
    if (document.fullscreenElement) return;
    if (stopDrawing) stopDrawing(false);
    [stopDrawing, redraw, move] = drawIconButton(
      is, () => {
        is.ctx.canvas.requestFullscreen();
        stopDisplay();
      },
      x(), y(), is.prepared.imgs.fullscreen.img,
    );
  }
  const stopDisplay = () => {
    if (stopDrawing) stopDrawing(false);
    stopDrawing = undefined;
    redraw = undefined;
    move = undefined;
    onRedraw();
  }

  const stopHover = is.addHoverRequest({ 
    isInArea: (xIn, yIn) => xIn >= x() - 70 && yIn >= y() - 70,
    onHover: () => { if (!document.fullscreenElement) display(); },
    onLeave: stopDisplay,
  });

  const newStopDrawing = (shouldRedraw: boolean) => {
    if (stopDrawing) stopDrawing(shouldRedraw);
    stopHover();
  }
  const newRedraw = () => {
    if (redraw) redraw();
  }
  const newMove = () => {
    if (move)
      move(is.ctx.canvas.width - is.prepared.imgs.fullscreen.img.width - 25, is.ctx.canvas.height - is.prepared.imgs.fullscreen.img.height - 25);
  }

  return [newStopDrawing, newRedraw, newMove];
}

export default drawButton;
