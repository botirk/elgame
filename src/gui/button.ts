import { InitSettings } from "..";
import settings from "../settings";
import { drawRoundedRect } from "./roundedRect";
import { calcTextWidth } from "./text";

interface ButtonOptional {
  minWidth?: number,
  height?: number,
  bgColor?: string,
  onWidthSet?: (value: number) => void,
  likeLabel?: boolean,
  onClick?: () => void,
}

export interface ButtonManager {
  stop: (shouldRedraw: boolean) => void,
  redraw: () => void,
  update: () => void,
}

const drawButton = (is: InitSettings, x: () => number, y: () => number, text: string, optional?: () => ButtonOptional) => {
  is.ctx.font = settings.fonts.ctxFont;
  const textWidth = calcTextWidth(is.ctx, text);
  const textHeight = settings.fonts.fontSize;
  const state = {
    isHover: false, isPressed: false,
    bgColor: undefined as string | undefined,
    width: textWidth + settings.gui.button.padding * 2,
    height: textHeight + settings.gui.button.padding * 2,
    buttonX: 0, buttonY: 0,
    textX: 0, textY: 0,
    likeLabel: undefined as boolean | undefined,
    onClick: undefined as (() => void) | undefined,
  };
  const update = () => {
    const optionalLocal = optional?.();
    state.bgColor = optionalLocal?.bgColor;
    state.width = Math.max(state.width, optionalLocal?.minWidth || 0);
    optionalLocal?.onWidthSet?.(state.width);
    state.height = optionalLocal?.height || state.height;
    const xLocal = x();
    state.buttonX = (xLocal - state.width / 2), state.buttonY = (y() - state.height / 2);
    state.textX = (xLocal - textWidth / 2), state.textY = (state.buttonY + state.height / 2 + textHeight / 3);
    state.likeLabel = optionalLocal?.likeLabel;
    state.onClick = optionalLocal?.onClick;
  }
  update();
  const isInArea = (x: number, y: number) => !state.likeLabel && x >= state.buttonX && x <= state.buttonX + state.width && y >= state.buttonY && y <= state.buttonY + state.height;
  
  const redrawLabel = () => {
    is.ctx.font = settings.fonts.ctxFont;
    if (state.bgColor) {
      is.ctx.fillStyle = state.bgColor;
    } else {
      is.ctx.fillStyle = settings.colors.button.bg;
    }
    is.ctx.fillRect(state.buttonX, state.buttonY, state.width, state.height);

    is.ctx.fillStyle = settings.colors.textColor;
    is.ctx.fillText(text, state.textX, state.textY);
  }
  const redrawText = () => {
    is.ctx.font = settings.fonts.ctxFont;
    if (state.bgColor) {
      is.ctx.fillStyle = state.bgColor;
    } else if (state.isPressed) {
      is.ctx.fillStyle = settings.colors.button.pressed;
    }
    if (!state.isHover) {
      if (!state.isPressed && !state.bgColor) is.ctx.fillStyle = settings.colors.button.bg;
      is.ctx.canvas.style.cursor = "default";
    } else {
      if (!state.isPressed && !state.bgColor) is.ctx.fillStyle = settings.colors.button.hover;
      is.ctx.canvas.style.cursor = "pointer";
    }
    drawRoundedRect(is.ctx, state.buttonX, state.buttonY, state.width, state.height, settings.gui.button.rounding);
    
    is.ctx.fillStyle = settings.colors.textColor;
    is.ctx.fillText(text, state.textX, state.textY);
  };
  const redraw = () => state.likeLabel ? redrawLabel() : redrawText();
  redraw();
  const stopHover = is.addHoverRequest({
    isInArea, 
    onHover: () => { state.isHover = true; redraw(); },
    onLeave: () => { state.isHover = false; redraw(); },
  });
  const stopClick = is.addClickRequest({
    isInArea,
    onReleased: (isInArea) => { state.isPressed = false; redraw(); if (isInArea) state.onClick?.(); },
    onPressed: () => { state.isPressed = true; redraw(); },
  });

  const stop = (shouldRedrawToDefault?: boolean) => {
    if (shouldRedrawToDefault && (state.isHover || state.isPressed)) {
      state.isHover = false;
      state.isPressed = false;
      redraw();
    }
    stopHover();
    stopClick();
  }

  return { stop, redraw, update };
}

export const drawIcon = (is: InitSettings, x: number, y: number, img: HTMLImageElement) => {
  is.ctx.drawImage(img, x, y, img.width, img.height);
}

export const drawIconButton = (is: InitSettings, x: () => number, y: () => number, img: HTMLImageElement, optional?: () => ButtonOptional): ButtonManager => {
  const state = {
    isHover: false, isPressed: false,
    bgColor: undefined as string | undefined,
    width: img.width + settings.gui.button.padding * 2,
    height: img.height + settings.gui.button.padding * 2,
    buttonX: 0, buttonY: 0,
    iconX: 0, iconY: 0,
    onClick: undefined as (() => void) | undefined,
    likeLabel: undefined as boolean | undefined,
  };
  const update = () => {
    const optionalLocal = optional?.();
    state.bgColor = optionalLocal?.bgColor;
    state.width = Math.max(state.width, optionalLocal?.minWidth || 0);
    optionalLocal?.onWidthSet?.(state.width);
    state.height = optionalLocal?.height || state.height;
    const xLocal = x(), yLocal = y();
    state.buttonX = (xLocal - state.width / 2), state.buttonY = (yLocal - state.height / 2);
    state.iconX = (xLocal - img.width / 2), state.iconY = (yLocal - img.height / 2);
    state.likeLabel = optionalLocal?.likeLabel;
  };
  update();
  const isInArea = (x: number, y: number) => !state.likeLabel && x >= state.buttonX && x <= state.buttonX + state.width && y >= state.buttonY && y <= state.buttonY + state.height;
  
  const redrawIconLabel = () => {
    if (state.bgColor) {
      is.ctx.fillStyle = state.bgColor;
    } else {
      is.ctx.fillStyle = settings.colors.button.bg;
    }
    is.ctx.fillRect(state.buttonX, state.buttonY, state.width, state.height);
    drawIcon(is, state.iconX, state.iconY, img);
  }
  const redrawIcon = () => {
    if (state?.bgColor) {
      is.ctx.fillStyle = state.bgColor;
    } else if (state.isPressed) {
      is.ctx.fillStyle = settings.colors.button.pressed;
    }
    if (!state.isHover) {
      if (!state.isPressed && !state.bgColor) is.ctx.fillStyle = settings.colors.button.bg;
      is.ctx.canvas.style.cursor = "default";
    } else {
      if (!state.isPressed && !state.bgColor) is.ctx.fillStyle = settings.colors.button.hover;
      is.ctx.canvas.style.cursor = "pointer";
    }
    drawRoundedRect(is.ctx, state.buttonX, state.buttonY, state.width, state.height, settings.gui.button.rounding);
    drawIcon(is, state.iconX, state.iconY, img);
  };
  const redraw = () => state.likeLabel ? redrawIconLabel() : redrawIcon();
  redraw();
  const stopHover = is.addHoverRequest({
    isInArea,
    onHover: () => { state.isHover = true; redraw(); },
    onLeave: () => { state.isHover = false; redraw(); },
  });
  const stopClick = is.addClickRequest({
    isInArea,
    onReleased: (isInArea) => { state.isPressed = false; redraw(); if (isInArea) state.onClick?.(); },
    onPressed: () => { state.isPressed = true; redraw(); },
  });

  const stop = (shouldRedrawToDefault?: boolean) => {
    if (shouldRedrawToDefault && (state.isHover || state.isPressed)) {
      state.isHover = false;
      state.isPressed = false;
      redraw();
    }
    stopHover();
    stopClick();
  }

  return { stop, redraw, update };
}

export const drawFullscreenButton = (is: InitSettings, onRedraw: () => void): ButtonManager => {
  let button: ButtonManager | undefined;
  const x = () => is.ctx.canvas.width - is.prepared.imgs.fullscreen.width / 2 - settings.gui.button.padding - 15;
  const y = () => is.ctx.canvas.height - is.prepared.imgs.fullscreen.height / 2 - settings.gui.button.padding - 15;

  const display = () => {
    if (document.fullscreenElement) return;
    if (button?.stop) button.stop(false);
    button = drawIconButton(
      is,x, y, is.prepared.imgs.fullscreen,
      () => ({ onClick: () => {
        is.ctx.canvas.requestFullscreen();
        stopDisplay();
      }})
    );
  };
  const stopDisplay = () => {
    if (button?.stop) button.stop(false);
    button = undefined;
    onRedraw();
  };

  const stopHover = is.addHoverRequest({ 
    isInArea: (xIn, yIn) => xIn >= x() - 70 && yIn >= y() - 70,
    onHover: () => { if (!document.fullscreenElement) display(); },
    onLeave: stopDisplay,
  });

  const newStop = (shouldRedraw: boolean) => {
    if (button?.stop) button.stop(shouldRedraw);
    stopHover();
  };
  const newRedraw = () => { if (button?.redraw) button.redraw(); };
  const newUpdate = () => { if (button?.update) button.update(); };

  return { stop: newStop, redraw: newRedraw, update: newUpdate };
}

export default drawButton;
