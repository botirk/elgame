import game, { desiredMinHeight, desiredMinWidth } from "./game";


const canInit = (elementId: string): [CanvasRenderingContext2D | undefined, string] => {
  const el = document.getElementById(elementId);
  if (!el) return [undefined, `Element with id ${elementId} not found`];
  if (el.tagName != "CANVAS") return [undefined, `Element is not <canvas>`];
  const ctx = (el as HTMLCanvasElement).getContext('2d');
  if (!ctx) return [undefined, `canvas.getContext does not work`];
  if (ctx.canvas.clientHeight < desiredMinHeight) return [undefined, `canvas.clientHeight is too small, ${desiredMinHeight} required`];
  if (ctx.canvas.clientWidth < desiredMinWidth) return [undefined, `canvas.clientWidth is too small, ${desiredMinWidth} required`];
  return [ctx, 'Can init'];
}


const init = (elementId: string) => {
  const [ctx, msg] = canInit(elementId);
  if (!ctx) alert(msg);
  return ctx;
}

const renderingContext = init("elgame");
if (renderingContext) game(renderingContext);