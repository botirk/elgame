import init, { Init } from "../init";
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
  update: (everything?: boolean, dontUpdateHover?: boolean) => void,
}

interface AbstractButtonCache {
  contentWidth: number, 
  contentHeight: number,
}

interface AbstractButtonCalced {
  startX: number, startY: number,
  endX: number, endY: number,
  width: number, height: number,
}

class AbstractButton<TCache extends AbstractButtonCache> {
  private readonly init: Init;
  private readonly x: () => number;
  private readonly y: () => number;
  private readonly cache: (x: number, y: number) => TCache;
  private readonly drawer: (x: number, y: number, cached: Readonly<TCache>, calced: Readonly<AbstractButtonCalced>) => void;
  private readonly optional?: (() => ButtonOptional);
  private readonly isLateGlue?: boolean;
  
  private isGlued = false;
  private contentX: number;
  private contentY: number;
  private width: number;
  private height: number;
  private startX: number;
  private startY: number;
  private endX: number; 
  private endY: number;
  private optionalSaved: ButtonOptional | undefined;
  private contentCache: TCache;
  
  private redrawLabel() {
    if (this.optionalSaved?.bgColor) {
      this.init.ctx.fillStyle = this.optionalSaved.bgColor;
    } else if (this.optionalSaved?.disabled) {
      this.init.ctx.fillStyle = settings.colors.button.disabled;
    } else {
      this.init.ctx.fillStyle = settings.colors.button.bg;
    }
    this.init.ctx.fillRect(this.startX, this.startY, this.width, this.height);
    this.drawer(this.contentX, this.contentY, this.contentCache, this as Readonly<AbstractButtonCalced>);
  }
  private redrawContent() {
    if (this.optionalSaved?.bgColor) {
      this.init.ctx.fillStyle = this.optionalSaved.bgColor;
    } else if (this.optionalSaved?.disabled) {
      this.init.ctx.fillStyle = settings.colors.button.disabled;
    } else if (this.clickManager.isPressed()) {
      this.init.ctx.fillStyle = settings.colors.button.pressed;
    } else if (this.hoverManager.isInArea()) {
      this.init.ctx.fillStyle = settings.colors.button.hover;
    } else {
      this.init.ctx.fillStyle = settings.colors.button.bg;
    }
    if (this.hoverManager.isInArea() && !this.optionalSaved?.disabled) {
      this.init.ctx.canvas.style.cursor = "pointer";
    } else {
      this.init.ctx.canvas.style.cursor = "default";
    }
    drawRoundedRect(this.init.ctx, this.startX, this.startY, this.width, this.height, settings.gui.button.rounding);
    this.drawer(this.contentX, this.contentY, this.contentCache, this as Readonly<AbstractButtonCalced>);
  }
  private glue() {
    if (this.isGlued) return false;
    this.isGlued = true;
    this.hoverManager = this.init.addHoverRequest({
      isInArea: this.isInArea,
      onHover: this.redraw,
      onLeave: this.redraw,
    });
    this.clickManager = this.init.addClickRequest({
      isInArea: this.isInArea,
      onReleased: (isInArea) => { 
        if (isInArea) {
          const shouldRedrawAfterClick = this.optionalSaved?.onClick?.();
          if (!(shouldRedrawAfterClick instanceof Promise) && shouldRedrawAfterClick !== false) this.redraw();
        } else {
          this.redraw();
        }
      },
      onPressed: this.redraw,
    });
    this.update(true);
    return true;
  }

  hoverManager: ReturnType<Init["addHoverRequest"]>;
  clickManager: ReturnType<Init["addClickRequest"]>;
  constructor(init: Init, x: () => number, y: () => number, cache: (x: number, y: number) => TCache, drawer: AbstractButton<TCache>["drawer"], optional?: () => ButtonOptional, isLateGlue?: boolean) {
    this.isInArea = this.isInArea.bind(this);
    this.redraw = this.redraw.bind(this);
    this.stop = this.stop.bind(this);
    this.update = this.update.bind(this);
    
    this.init = init;
    this.x = x;
    this.y = y;
    this.cache = cache;
    this.drawer = drawer;
    this.optional = optional;
    this.isLateGlue = isLateGlue;
    if (!isLateGlue) {
      this.glue();
      this.redraw();
    }
  }
  private isInArea(x: number, y: number) {
    return x >= this.startX && x <= this.endX && y >= this.startY && y <= this.endY;
  }
  redraw() {
    this.glue();
    this.optionalSaved?.likeLabel ? this.redrawLabel() : this.redrawContent();
  }
  update(everything?: boolean, dontUpdateHover?: boolean) {
    if (this.glue()) return;
    this.contentX = this.x(), this.contentY = this.y();
    this.contentCache = this.cache(this.contentX, this.contentY);
    if (everything) {
      this.optionalSaved = this.optional?.();
      this.width = Math.max(this.contentCache.contentWidth + settings.gui.button.padding * 2, this.optionalSaved?.minWidth || 0);
      this.height = Math.max(this.contentCache.contentHeight + settings.gui.button.padding * 2, this.optionalSaved?.minHeight || 0);
    }
    this.startX = this.contentX - this.width / 2;
    this.startY = this.contentY - this.height / 2;
    this.endX = this.startX + this.width;
    this.endY = this.startY + this.height;
    if (!dontUpdateHover) this.hoverManager.update();
  }
  stop(shouldRedrawToDefault?: boolean) {
    this.glue();
    this.clickManager.stop();
    this.hoverManager.stop();
    if (shouldRedrawToDefault) this.redraw();
  }
}

export const drawButton = (init: Init, x: () => number, y: () => number, text: string, optional?: () => ButtonOptional, isLateGlue?: boolean): ButtonManager => {
  return new AbstractButton(init, x, y, (x, y) => {
    init.ctx.font = settings.fonts.ctxFont;
    // TODO: stop calcing it every time
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
  return new AbstractButton(init, x, y, (x, y) => {
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
  return new AbstractButton(init, x, y, (x, y) => {
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
