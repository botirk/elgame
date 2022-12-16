import { Init } from "../init";
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
  lateGlue?: boolean,
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

interface ButtonAbstractCalced {
  startX: number, startY: number,
  endX: number, endY: number,
  width: number, height: number,
}

const drawAbstractButton = <TCache extends ButtonAbstractCache>(init: Init, x: () => number, y: () => number, cache: (x: number, y: number) => TCache, drawer: (x: number, y: number, cached: Readonly<TCache>, calced: Readonly<ButtonAbstractCalced>) => void, optional?: () => ButtonOptional, isLateGlue?: boolean) => {
  // state gen
  const getState = (redraw: () => void, isStopped: boolean, isPressed: boolean, isHover: boolean, stopClick?: () => void, stopHover?: () => void) => {
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
    const isInArea = (x: number, y: number) => x >= state.startX && x <= state.endX && y >= state.startY && y <= state.endY;
    // state
    const state = {
      isStopped, contentX, contentY, contentCache, width, height, startX, startY, endX, endY, 
      bgColor, likeLabel, disabled, isPressed, isHover, stopHover, stopClick, isInArea
    }
    // new callbacks
    state.stopClick?.();
    state.stopClick = undefined;
    state.stopHover?.();
    state.stopHover = undefined;
    // update callbacks
    if (state.likeLabel || state.disabled || state.isStopped) {
      state.isHover = false;
      state.isPressed = false;
    } else {
      state.stopClick = init.addClickRequest({
        isInArea: state.isInArea,
        onReleased: (isInArea) => { state.isPressed = false; redraw(); if (isInArea) onClick?.(); },
        onPressed: () => { state.isPressed = true; redraw(); },
      });
      state.stopHover = init.addHoverRequest({
        isInArea: state.isInArea,
        onHover: () => { state.isHover = true; redraw(); },
        onLeave: () => { state.isHover = false; redraw(); },
      });
    }

    return state;
  };
  // glue
  const glue = () => {
    // state 
    let state = getState(() => redraw(), false, false, false);
    // drawing
    const redrawLabel = () => {
      if (state.bgColor) {
        init.ctx.fillStyle = state.bgColor;
      } else if (state.disabled) {
        init.ctx.fillStyle = settings.colors.button.disabled;
      } else {
        init.ctx.fillStyle = settings.colors.button.bg;
      }
      init.ctx.fillRect(state.startX, state.startY, state.width, state.height);
      drawer(state.contentX, state.contentY, state.contentCache, state);
    };
    const redrawContent = () => {
      if (state.bgColor) {
        init.ctx.fillStyle = state.bgColor;
      } else if (state.disabled) {
        init.ctx.fillStyle = settings.colors.button.disabled;
      } else if (state.isPressed) {
        init.ctx.fillStyle = settings.colors.button.pressed;
      } else if (state.isHover) {
        init.ctx.fillStyle = settings.colors.button.hover;
      } else {
        init.ctx.fillStyle = settings.colors.button.bg;
      }
      if (state.isHover && !state.disabled) {
        init.ctx.canvas.style.cursor = "pointer";
      } else {
        init.ctx.canvas.style.cursor = "default";
      }
      drawRoundedRect(init.ctx, state.startX, state.startY, state.width, state.height, settings.gui.button.rounding);
      drawer(state.contentX, state.contentY, state.contentCache, state);
    };
    const redraw = () => state.likeLabel ? redrawLabel() : redrawContent();
    redraw();
    
    // user functions
    const stop = (shouldRedrawToDefault?: boolean) => {
      state.isStopped = true;
      if (shouldRedrawToDefault && (state.isHover || state.isPressed)) {
        state.isHover = false;
        state.isPressed = false;
        redraw();
      }
      state.stopClick?.();
      state.stopHover?.();
    };
    const update = () => {
      state = getState(redraw, state.isStopped, state.isPressed, state.isHover, state.stopClick, state.stopHover);
    }

    return { redraw, stop, update };
  }
  // late glue
  if (isLateGlue) {
    let manager: ButtonManager | undefined;
    return {
      stop: (shouldRedraw: boolean) => { 
        if (!manager) manager = glue();
        manager.stop(shouldRedraw);
      },
      redraw: () => {
        if (!manager) manager = glue();
        manager.redraw();
      },
      update: () => {
        if (!manager) manager = glue();
        manager.update();
      }
    }
  } else {
    return glue();
  }
}

export const drawButton = (init: Init, x: () => number, y: () => number, text: string, optional?: () => ButtonOptional, isLateGlue?: boolean) => {
  return drawAbstractButton(init, x, y, (x, y) => {
    init.ctx.font = settings.fonts.ctxFont;
    const contentWidth = calcTextWidth(init.ctx, text);
    return {
      contentWidth, 
      contentHeight: settings.fonts.fontSize,
      textX: x - contentWidth / 2,
      textY: y + settings.fonts.fontSize / 3,
    };
  }, (x, y, cache) => {
    init.ctx.font = settings.fonts.ctxFont;
    init.ctx.fillStyle = settings.colors.textColor;
    init.ctx.fillText(text, cache.textX, cache.textY);
  }, optional, isLateGlue);
}

export const calcButtonWithDescription = (init: Init, text: string, description: string) => {
  init.ctx.font = settings.fonts.ctxFont;
  const firstWidth = calcTextWidth(init.ctx, text);
  const secondWidth = calcTextWidth(init.ctx, description);
  const oneHeight = settings.fonts.fontSize + settings.gui.button.padding;
  return {
    firstWidth, secondWidth, oneHeight,
    contentWidth: Math.max(firstWidth, secondWidth),
    contentHeight: oneHeight * 2 + 1,
  };
}

export const drawButtonWithDescription = (init: Init, x: () => number, y: () => number, text: string, description: string, optional?: () => ButtonOptional, isLateGlue?: boolean) => {
  return drawAbstractButton(init, x, y, (x, y) => {
    const { contentHeight, contentWidth, firstWidth, secondWidth } = calcButtonWithDescription(init, text, description);
    return {
      contentWidth,
      contentHeight,
      textX: x - firstWidth / 2,
      textY: y - 1 - settings.fonts.fontSize / 3,
      descX: x - secondWidth / 2,
      descY: y + settings.fonts.fontSize,
    };
  }, (x, y, cache, calced) => {
    init.ctx.font = settings.fonts.ctxFont;
    init.ctx.fillStyle = settings.colors.textColor;
    init.ctx.fillText(text, cache.textX, cache.textY);
    init.ctx.strokeStyle = settings.colors.textColor;
    init.ctx.beginPath();
    init.ctx.moveTo(calced.startX, y);
    init.ctx.lineTo(calced.endX, y);
    init.ctx.stroke();
    init.ctx.fillText(description, cache.descX, cache.descY);
  }, optional, isLateGlue);
}

export const drawIcon = (init: Init, x: number, y: number, img: HTMLImageElement) => {
  init.ctx.drawImage(img, x, y, img.width, img.height);
}

export const drawIconButton = (init: Init, x: () => number, y: () => number, img: HTMLImageElement, optional?: () => ButtonOptional, isLateGlue?: boolean): ButtonManager => {
  return drawAbstractButton(init, x, y, (x, y) => {
    return {
      contentHeight: img.height,
      contentWidth: img.width,
      iconX: x - img.width / 2,
      iconY: y - img.height / 2,
    }
  }, (x, y, cache) => {
    drawIcon(init, cache.iconX, cache.iconY, img);
  }, optional, isLateGlue);
}

export const drawFullscreenButton = (init: Init, onRedraw: () => void): ButtonManager => {
  let button: ButtonManager | undefined;
  const x = () => init.ctx.canvas.width - init.prepared.imgs.fullscreen.width / 2 - settings.gui.button.padding - 15;
  const y = () => init.ctx.canvas.height - init.prepared.imgs.fullscreen.height / 2 - settings.gui.button.padding - 15;

  const display = () => {
    if (document.fullscreenElement) return;
    if (button?.stop) button.stop(false);
    button = drawIconButton(
      init,x, y, init.prepared.imgs.fullscreen,
      () => ({ onClick: () => {
        init.ctx.canvas.requestFullscreen();
        stopDisplay();
      }})
    );
  };
  const stopDisplay = () => {
    if (button?.stop) button.stop(false);
    button = undefined;
    onRedraw();
  };

  const stopHover = init.addHoverRequest({ 
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
