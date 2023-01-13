import { loadAssets, loadWords } from "./asset";
import button from "./gui/events/button";
import click from "./gui/events/click";
import hover from "./gui/events/hover";
import move from "./gui/events/move";
import resize from "./gui/events/resize";
import settings from "./settings";

const reprepareLocal = (ctx: CanvasRenderingContext2D) => {
  // set height to fixed
  {
    const ratio = settings.dimensions.heigth / ctx.canvas.clientHeight;
    ctx.canvas.width = ctx.canvas.clientWidth * ratio;
    ctx.canvas.height = ctx.canvas.clientHeight * ratio;
  }
  // fix width
  const currentWidthToHeightRatio = ctx.canvas.width / ctx.canvas.height;
  if (currentWidthToHeightRatio < settings.dimensions.widthToHeightRatio) {
    ctx.canvas.width = ctx.canvas.height * settings.dimensions.widthToHeightRatio;
  }
  // add shadow
  ctx.shadowColor = "black";
  ctx.shadowBlur = 1;
  // set font
  ctx.font = settings.fonts.ctxFont;
  // calc
  const isMobile = settings.calculate.isMobile(currentWidthToHeightRatio);
  const gameWidth = settings.calculate.gameWidth(isMobile);
  // settings
  return {
    isMobile,
    gameWidth,
    gameX: settings.calculate.gameX(ctx, gameWidth),
    gameXMax: settings.calculate.gameXMax(ctx, gameWidth),
    verticalSpeedMultiplier: isMobile ? 1 : 1.33,
  };
}

const prepareLocal = async (ctx: CanvasRenderingContext2D) => {
  return {
    ...reprepareLocal(ctx),
    imgs: await loadAssets(settings.gui.icon.width, "width"),
    words: await loadWords(settings.gui.icon.width, "width"),
  }
}

export const reprepareInit = (init: Init) => ({
  ...init.prepared,
  ...reprepareLocal(init.ctx)
})

const init = async (elementId: string, isDev?: boolean) => {
  const el = document.getElementById(elementId);
  if (!el) return `Element with id ${elementId} not found`;
  if (el.tagName != "CANVAS") return `Element is not <canvas>`;
  const ctx = (el as HTMLCanvasElement).getContext('2d');
  if (!ctx) return `canvas.getContext does not work`;
  return {
    isDev,
    ctx,
    addResizeRequest: resize(ctx),
    addMoveRequest: move(ctx),
    addHoverRequest: hover(ctx),
    addClickRequest: click(ctx),
    addButtonRequest: button(ctx),
    prepared: await prepareLocal(ctx),
  };
}

export type Init = Exclude<Awaited<ReturnType<typeof init>>, string>;

export default init;