import settings, { InitSettings } from "./settings";
import drawMenu from "./gui/menu";
import hover from "./gui/hover";
import click from "./gui/click";

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

const init = (elementId: string) => {
  const [ctx, msg] = canInit(elementId);
  if (ctx) {
    // set height to fixed
    {
      const ratio =  settings.dimensions.heigth / ctx.canvas.clientHeight;
      ctx.canvas.width = ctx.canvas.clientWidth * ratio;
      ctx.canvas.height = ctx.canvas.clientHeight * ratio;
    }
    // fix width
    const currentWidthToHeightRatio = ctx.canvas.width / ctx.canvas.height;
    if (currentWidthToHeightRatio < settings.dimensions.widthToHeightRatio) {
      ctx.canvas.width = ctx.canvas.height * settings.dimensions.widthToHeightRatio;
    }
    const isMobile = settings.dimensions.isMobile(currentWidthToHeightRatio);
    const gameWidth = settings.dimensions.gameWidth(isMobile);
    drawMenu({
      ...settings,
      ctx,
      addHoverRequest: hover(ctx),
      addClickRequest: click(ctx),
      calculated: { 
        isMobile,
        gameWidth,
        gameXMin: settings.dimensions.gameXMin(ctx, gameWidth),
        gameXMax: settings.dimensions.gameXMax(ctx, gameWidth),
      },
    });
  }
  return [!!ctx, msg];
}

export default init;
