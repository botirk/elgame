import { Init } from "../init";
import settings from "../settings";
import { mergeDeep } from "../utils";
import { HoverManager } from "./events/hover";
import { drawRoundedRect } from "./roundedRect";
import { calcTextWidth } from "./text";

type ShouldRedrawAfterClick = boolean | void | Promise<void>;
interface ButtonOptional {
  minWidth?: number,
  minHeight?: number,
  bgColor?: string,
  likeLabel?: boolean,
  onClick?: () => ShouldRedrawAfterClick,
  disabled?: boolean,
  lateGlue?: boolean,
}

export interface ButtonManager {
  stop: (shouldRedraw: boolean) => void,
  redraw: () => void,
  update: (dontUpdateHover?: boolean) => void,
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

const initAbstractButtonState = {
  pos: {
    contentX: 0, contentY: 0, width: 0, height: 0, startX: 0, startY: 0, endX: 0, endY: 0,
    isInArea: function(x: number, y: number) { return x >= this.startX && x <= this.endX && y >= this.startY && y <= this.endY },
    hoverManager: undefined as undefined | ReturnType<Init["addHoverRequest"]>,
    clickManager: undefined as undefined | ReturnType<Init["addClickRequest"]>,
  },
  
};

const abstractButtonState = <TCache extends ButtonAbstractCache>(init: Init, redraw: () => void, x: () => number, y: () => number, cache: (x: number, y: number) => TCache, optional?: () => ButtonOptional) => {
  const pos = {
    contentX: 0, contentY: 0,
    width: 0, height: 0,
    startX: 0, startY: 0,
    endX: 0, endY: 0,
  }
  const contentCache = {
    contentWidth: 0, contentHeight: 0,
  } as TCache;
  const optionalSaved: ReturnType<Extract<typeof optional, () => ButtonOptional>> = {};
  const isInArea = (x: number, y: number) => x >= pos.startX && x <= pos.endX && y >= pos.startY && y <= pos.endY;
  const hoverManager = init.addHoverRequest({
    isInArea,
    onHover: redraw,
    onLeave: redraw,
  });
  const clickManager = init.addClickRequest({
    isInArea,
    onReleased: (isInArea) => { 
      if (isInArea) {
        const shouldRedrawAfterClick = optionalSaved?.onClick?.();
        if (!(shouldRedrawAfterClick instanceof Promise) && shouldRedrawAfterClick !== false) redraw();
      } else {
        redraw();
      }
    },
    onPressed: redraw,
  });
  const update = (dontUpdateHover?: boolean) => {
    pos.contentX = x(), pos.contentY = y();
    mergeDeep(contentCache, cache(pos.contentX, pos.contentY));
    mergeDeep(optionalSaved, optional?.());
    pos.width = Math.max(contentCache.contentWidth + settings.gui.button.padding * 2, optionalSaved?.minWidth || 0);
    pos.height = Math.max(contentCache.contentHeight + settings.gui.button.padding * 2, optionalSaved?.minHeight || 0);
    pos.startX = pos.contentX - pos.width / 2;
    pos.startY = pos.contentY - pos.height / 2;
    pos.endX = pos.startX + pos.width;
    pos.endY = pos.startY + pos.height;
    if (!dontUpdateHover) hoverManager.update();
  }
  update();
  // state
  return {
    hoverManager, clickManager, pos: pos as Readonly<typeof pos>, optionalSaved: optionalSaved as Readonly<typeof optionalSaved>, contentCache: contentCache as TCache, update,
  }
}

const drawAbstractButton = <TCache extends ButtonAbstractCache>(init: Init, x: () => number, y: () => number, cache: (x: number, y: number) => TCache, drawer: (x: number, y: number, cached: Readonly<TCache>, calced: Readonly<ButtonAbstractCalced>) => void, optional?: () => ButtonOptional, isLateGlue?: boolean): ButtonManager => {
  // glue
  const glue = () => {
    // state 
    const state = abstractButtonState(init, () => redraw(), x, y, cache, optional) as ReturnType<typeof abstractButtonState<TCache>>;
    // drawing
    const redrawLabel = () => {
      if (state.optionalSaved.bgColor) {
        init.ctx.fillStyle = state.optionalSaved.bgColor;
      } else if (state.optionalSaved.disabled) {
        init.ctx.fillStyle = settings.colors.button.disabled;
      } else {
        init.ctx.fillStyle = settings.colors.button.bg;
      }
      init.ctx.fillRect(state.pos.startX, state.pos.startY, state.pos.width, state.pos.height);
      drawer(state.pos.contentX, state.pos.contentY, state.contentCache, state.pos);
    };
    const redrawContent = () => {
      if (state.optionalSaved.bgColor) {
        init.ctx.fillStyle = state.optionalSaved.bgColor;
      } else if (state.optionalSaved.disabled) {
        init.ctx.fillStyle = settings.colors.button.disabled;
      } else if (state.clickManager.isPressed()) {
        init.ctx.fillStyle = settings.colors.button.pressed;
      } else if (state.hoverManager.isInArea()) {
        init.ctx.fillStyle = settings.colors.button.hover;
      } else {
        init.ctx.fillStyle = settings.colors.button.bg;
      }
      if (state.hoverManager.isInArea() && !state.optionalSaved.disabled) {
        init.ctx.canvas.style.cursor = "pointer";
      } else {
        init.ctx.canvas.style.cursor = "default";
      }
      drawRoundedRect(init.ctx, state.pos.startX, state.pos.startY, state.pos.width, state.pos.height, settings.gui.button.rounding);
      drawer(state.pos.contentX, state.pos.contentY, state.contentCache, state.pos);
    };
    const redraw = () => state.optionalSaved.likeLabel ? redrawLabel() : redrawContent();
    redraw();
    // user functions
    const stop = (shouldRedrawToDefault?: boolean) => {
      state.clickManager.stop();
      state.hoverManager.stop();
      if (shouldRedrawToDefault) redraw();
    };
    const update = state.update;
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

export const drawButton = (init: Init, x: () => number, y: () => number, text: string, optional?: () => ButtonOptional, isLateGlue?: boolean): ButtonManager => {
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

export const drawButtonWithDescription = (init: Init, x: () => number, y: () => number, text: string, description: string, optional?: () => ButtonOptional, isLateGlue?: boolean): ButtonManager => {
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
      }}),
    );
  };
  const stopDisplay = () => {
    if (button?.stop) button.stop(false);
    button = undefined;
    onRedraw();
  };

  const hoverManager = init.addHoverRequest({ 
    isInArea: (xIn, yIn) => xIn >= x() - 70 && yIn >= y() - 70,
    onHover: () => { if (!document.fullscreenElement) display(); },
    onLeave: stopDisplay,
  });

  const newStop = (shouldRedraw: boolean) => {
    if (button?.stop) button.stop(shouldRedraw);
    hoverManager.stop();
  };
  const newRedraw = () => { if (button?.redraw) button.redraw(); };
  const newUpdate = () => { if (button?.update) button.update(); };

  return { stop: newStop, redraw: newRedraw, update: newUpdate };
}
