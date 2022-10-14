import settings, { Settings } from "./settings";
import drawMenu from "./gui/menu";
import hover from "./gui/events/hover";
import click from "./gui/events/click";
import move from "./gui/events/move";
import button from "./gui/events/button";

export const canInit = (elementId: string): [CanvasRenderingContext2D | undefined, string] => {
  const el = document.getElementById(elementId);
  if (!el) return [undefined, `Element with id ${elementId} not found`];
  if (el.tagName != "CANVAS") return [undefined, `Element is not <canvas>`];
  const ctx = (el as HTMLCanvasElement).getContext('2d');
  if (!ctx) return [undefined, `canvas.getContext does not work`];
  if (ctx.canvas.clientHeight < settings.dimensions.desiredClientMinHeight) return [undefined, `canvas.clientHeight is too small, ${settings.dimensions.desiredClientMinHeight} required`];
  if (ctx.canvas.clientWidth < settings.dimensions.desiredClientMinWidth) return [undefined, `canvas.clientWidth is too small, ${settings.dimensions.desiredClientMinWidth} required`];
  return [ctx, 'Can init'];
}

export interface InitSettings extends Settings {
  ctx: CanvasRenderingContext2D,
  addMoveRequest: ReturnType<typeof move>,
  addHoverRequest: ReturnType<typeof hover>,
  addClickRequest: ReturnType<typeof click>,
  addButtonRequest: ReturnType<typeof button>,
  calculated: {
    isMobile: boolean,
    gameWidth: number, clickableGameWidth: number,
    gameX: number, gameXMax: number, clickableGameX: number, clickableGameXMax: number,
    verticalSpeedMultiplier: number,
  }
}

const init = (elementId: string) => {
  const [ctx, msg] = canInit(elementId);
  if (ctx) {
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
    // calc
    const isMobile = settings.calculate.isMobile(currentWidthToHeightRatio);
    const gameWidth = settings.calculate.gameWidth(isMobile);
    drawMenu({
      ...settings,
      ctx,
      addMoveRequest: move(ctx),
      addHoverRequest: hover(ctx),
      addClickRequest: click(ctx),
      addButtonRequest: button(ctx),
      calculated: {
        isMobile,
        gameWidth, clickableGameWidth: settings.calculate.clickableGameWidth(ctx, gameWidth),
        gameX: settings.calculate.gameX(ctx, gameWidth),
        clickableGameX: settings.calculate.clickableGameX(ctx, gameWidth),
        clickableGameXMax: settings.calculate.clickableGameXMax(ctx, gameWidth),
        gameXMax: settings.calculate.gameXMax(ctx, gameWidth),
        verticalSpeedMultiplier: isMobile ? 1 : 1.33,
      },
    });
  }
  return [!!ctx, msg];
}

export default init;
