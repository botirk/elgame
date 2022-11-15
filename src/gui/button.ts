import { InitSettings } from "..";
import settings from "../settings";
import { drawRoundedRect } from "./roundedRect";
import { calcTextWidth } from "./text";

interface ButtonOptional {
  minWidth?: number,
  minHeight?: number,
  bgColor?: string,
  likeLabel?: boolean,
  onClick?: () => void,
  disabled?: boolean,
}

export interface ButtonManager {
  stop: (shouldRedraw: boolean) => void,
  redraw: () => void,
  update: () => void,
}

interface ButtonAbstractCache {
  contentWidth: number, 
  contentHeight: number,
}

const drawAbstractButton = <TCache extends ButtonAbstractCache>(is: InitSettings, x: () => number, y: () => number, cache: (x: number, y: number) => TCache, drawer: (x: number, y: number, cache: TCache) => void, optional?: () => ButtonOptional) => {
  const isInArea = (x: number, y: number) => x >= state.startX && x <= state.endX && y >= state.startY && y <= state.endY;
  const getState = (isPressed: boolean, isHover: boolean, stopClick?: () => void, stopHover?: () => void) => {
    const contentX = x();
    const contentY = y();
    const contentCache = cache(contentX, contentY);
    const optionalLocal = optional?.();
    const width = Math.max(contentCache.contentWidth + settings.gui.button.padding * 2, optionalLocal?.minWidth || 0);
    const height = Math.max(contentCache.contentHeight + settings.gui.button.padding * 2, optionalLocal?.minHeight || 0);
    const startX = contentX - width / 2;
    const startY = contentY - height / 2;
    const endX = startX + width;
    const endY = startY + height;
    const bgColor = optionalLocal?.bgColor;
    const likeLabel = optionalLocal?.likeLabel;
    const onClick = optionalLocal?.onClick;
    const disabled = optionalLocal?.disabled;
    // state
    const state = {
      contentX, contentY, contentCache, width, height, startX, startY, endX, endY, bgColor, likeLabel, disabled, isPressed, isHover, stopHover, stopClick
    }
    // update callbacks
    if (state.likeLabel || state.disabled) {
      state.isHover = false;
      state.isPressed = false;
      state.stopClick?.();
      state.stopClick = undefined;
      state.stopHover?.();
      state.stopHover = undefined;
    } else {
      if (!state.stopClick) {
        state.stopClick = is.addClickRequest({
          isInArea,
          onReleased: (isInArea) => { state.isPressed = false; redraw(); if (isInArea) onClick?.(); },
          onPressed: () => { state.isPressed = true; redraw(); },
        });
      }
      if (!state.stopHover) {
        state.stopHover = is.addHoverRequest({
          isInArea,
          onHover: () => { state.isHover = true; redraw(); },
          onLeave: () => { state.isHover = false; redraw(); },
        });
      }
    }

    return state;
  };
  let state = getState(false, false);

  const redrawLabel = () => {
    if (state.bgColor) {
      is.ctx.fillStyle = state.bgColor;
    } else if (state.disabled) {
      is.ctx.fillStyle = settings.colors.button.disabled;
    } else {
      is.ctx.fillStyle = settings.colors.button.bg;
    }
    is.ctx.fillRect(state.startX, state.startY, state.width, state.height);
    drawer(state.contentX, state.contentY, state.contentCache);
  };
  const redrawContent = () => {
    if (state.bgColor) {
      is.ctx.fillStyle = state.bgColor;
    } else if (state.disabled) {
      is.ctx.fillStyle = settings.colors.button.disabled;
    } else if (state.isPressed) {
      is.ctx.fillStyle = settings.colors.button.pressed;
    } else if (state.isHover) {
      is.ctx.fillStyle = settings.colors.button.hover;
    } else {
      is.ctx.fillStyle = settings.colors.button.bg;
    }
    if (state.isHover && !state.disabled) {
      is.ctx.canvas.style.cursor = "pointer";
    } else {
      is.ctx.canvas.style.cursor = "default";
    }
    drawRoundedRect(is.ctx, state.startX, state.startY, state.width, state.height, settings.gui.button.rounding);
    drawer(state.contentX, state.contentY, state.contentCache);
  };
  const redraw = () => state.likeLabel ? redrawLabel() : redrawContent();
  redraw();

  const stop = (shouldRedrawToDefault?: boolean) => {
    if (shouldRedrawToDefault && (state.isHover || state.isPressed)) {
      state.isHover = false;
      state.isPressed = false;
      redraw();
    }
    state.stopClick?.();
    state.stopHover?.();
  };

  const update = () => {
    state = getState(state.isPressed, state.isHover, state.stopClick, state.stopHover);
  }

  return { redraw, stop, update };
}

export const drawButton = (is: InitSettings, x: () => number, y: () => number, text: string, optional?: () => ButtonOptional) => {
  return drawAbstractButton(is, x, y, (x, y) => {
    is.ctx.font = settings.fonts.ctxFont;
    const contentWidth = calcTextWidth(is.ctx, text);
    return {
      contentWidth, 
      contentHeight: settings.fonts.fontSize,
      textX: x - contentWidth / 2,
      textY: y + settings.fonts.fontSize / 3,
    };
  }, (x, y, cache) => {
    is.ctx.font = settings.fonts.ctxFont;
    is.ctx.fillStyle = settings.colors.textColor;
    is.ctx.fillText(text, cache.textX, cache.textY);
  }, optional);
}

export const drawIcon = (is: InitSettings, x: number, y: number, img: HTMLImageElement) => {
  is.ctx.drawImage(img, x, y, img.width, img.height);
}

export const drawIconButton = (is: InitSettings, x: () => number, y: () => number, img: HTMLImageElement, optional?: () => ButtonOptional): ButtonManager => {
  return drawAbstractButton(is, x, y, (x, y) => {
    return {
      contentHeight: img.height,
      contentWidth: img.width,
      iconX: x - img.width / 2,
      iconY: y - img.height / 2,
    }
  }, (x, y, cache) => {
    drawIcon(is, cache.iconX, cache.iconY, img);
  }, optional);
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
