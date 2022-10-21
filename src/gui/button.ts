import { InitSettings } from "..";
import settings from "../settings";
import drawRoundedRect from "./roundedRect";

const drawButton = (is: InitSettings, onClick: () => void, x: number, y: number, text: string, width: number, height?: number): 
                   [(shouldRedraw: boolean) => void, () => void, (xTo: number, yTo: number) => void] => {
  is.ctx.font = settings.fonts.ctxFont;
  const metrics = is.ctx.measureText(text);

  const textWidth = metrics.width;
  const textHeight = settings.fonts.fontSize;
  height ??= textHeight + settings.gui.button.padding * 2;
  let buttonX = 0, buttonY = 0;
  let textX = 0, textY = 0;
  const move = (xTo: number, yTo: number) => {
    x = xTo, y = yTo;
    buttonX = (x - width / 2), buttonY = (y - (height as number) / 2);
    textX = (x - textWidth / 2), textY = (buttonY + (height as number) / 2 + textHeight / 3);
  }
  move(x, y);
  const isInArea = (x: number, y: number) => x >= buttonX && x <= buttonX + width && y >= buttonY && y <= buttonY + (height as number);

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
    drawRoundedRect(is.ctx, buttonX, buttonY, width, (height as number), settings.gui.button.rounding);
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
  return [stopDrawing, redraw, move];
}

export const drawIcon = (is: InitSettings, x: number, y: number, img: HTMLImageElement) => {
  is.ctx.drawImage(img, x, y, img.width, img.height);
}

export const drawIconButton = (is: InitSettings, img: HTMLImageElement, x: number, y: number, onClick: () => void): 
                              [(shouldRedraw: boolean) => void, () => void, (xTo: number, yTo: number) => void] => {
  const isInArea = (xA: number, yA: number) => xA >= x && xA <= x + img.width + settings.gui.button.padding * 2 && yA >= y && yA <= y + img.height + settings.gui.button.padding * 2;

  const state = { isHover: false, isPressed: false };
  const redraw = () => {
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
    drawRoundedRect(is.ctx, x, y, img.width + settings.gui.button.padding * 2, img.height + settings.gui.button.padding * 2, settings.gui.button.rounding);
    drawIcon(is, x + settings.gui.button.padding, y + settings.gui.button.padding, img);
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

  const move = (xTo: number, yTo: number) => { x = xTo, y = yTo };
  return [stopDrawing, redraw, move];
}

export const drawFullscreenButton = (is: InitSettings, onRedraw: () => void): [(shouldRedraw: boolean) => void, () => void, () => void] => {
  let [stopDrawing, redraw, move]: [ReturnType<typeof drawIconButton>[0] | undefined, ReturnType<typeof drawIconButton>[1] | undefined, ReturnType<typeof drawIconButton>[2] | undefined] = [undefined, undefined, undefined];
  const x = () => is.ctx.canvas.width - is.prepared.imgs.fullscreen.img.width - 25;
  const y = () => is.ctx.canvas.height - is.prepared.imgs.fullscreen.img.height - 25;

  const display = () => {
    if (document.fullscreenElement) return;
    if (stopDrawing) stopDrawing(false);
    [stopDrawing, redraw, move] = drawIconButton(
      is, is.prepared.imgs.fullscreen.img, 
      x(), y(),
      () => {
        is.ctx.canvas.requestFullscreen();
        stopDisplay();
      },
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
