import settings, { Settings } from "./settings";
import drawMenu from "./gui/menu";
import hover from "./gui/events/hover";
import click from "./gui/events/click";
import move from "./gui/events/move";
import button from "./gui/events/button";
import prepare, { Prepared } from "./gui/prepare";
import drawLoading from "./gui/loading";
import resize from "./gui/events/resize";

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

export interface InitSettings {
  ctx: CanvasRenderingContext2D,
  addMoveRequest: ReturnType<typeof move>,
  addHoverRequest: ReturnType<typeof hover>,
  addClickRequest: ReturnType<typeof click>,
  addButtonRequest: ReturnType<typeof button>,
  addResizeRequest: ReturnType<typeof resize>,
  prepared: Prepared,
}

const init = async (elementId: string) => {
  const [ctx, msg] = canInit(elementId);
  if (ctx) {
    // loading
    drawLoading(ctx);
    // calc
    drawMenu({
      ctx,
      addResizeRequest: resize(ctx),
      addMoveRequest: move(ctx),
      addHoverRequest: hover(ctx),
      addClickRequest: click(ctx),
      addButtonRequest: button(ctx),
      prepared: await prepare(ctx),
    });
  }
  return [!!ctx, msg];
}

export default init;
