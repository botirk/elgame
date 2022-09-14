import settings, { InitSettings } from "./settings";
import drawMenu from "./gui/menu";
import hover from "./gui/hover";

export const canInit = (elementId: string): [CanvasRenderingContext2D | undefined, string] => {
  const el = document.getElementById(elementId);
  if (!el) return [undefined, `Element with id ${elementId} not found`];
  if (el.tagName != "CANVAS") return [undefined, `Element is not <canvas>`];
  const ctx = (el as HTMLCanvasElement).getContext('2d');
  if (!ctx) return [undefined, `canvas.getContext does not work`];
  if (ctx.canvas.clientHeight < settings.desiredMinHeight) return [undefined, `canvas.clientHeight is too small, ${settings.desiredMinHeight} required`];
  if (ctx.canvas.clientWidth < settings.desiredMinWidth) return [undefined, `canvas.clientWidth is too small, ${settings.desiredMinWidth} required`];
  return [ctx, 'Can init'];
}

const init = (elementId: string) => {
  const [ctx, msg] = canInit(elementId);
  if (ctx) {
    ctx.canvas.width = ctx.canvas.clientWidth, ctx.canvas.height = ctx.canvas.clientHeight;
    drawMenu({
      ...settings,
      ctx,
      addHoverRequest: hover(ctx),
      ctxFont: `${settings.fontSize}px ${settings.font}`,
    });
  }
  return [!!ctx, msg];
}

export default init;
