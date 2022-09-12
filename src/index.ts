import game from "./game";


const canInit = (elementId: string): [CanvasRenderingContext2D | undefined, string] => {
  const el = document.getElementById(elementId);
  if (!el) return [undefined, `Element with id ${elementId} not found`];
  if (el.tagName != "CANVAS") return [undefined, `Element is not <canvas>`];
  const renderingContext = (el as HTMLCanvasElement).getContext('2d');
  if (!renderingContext) return [undefined, `canvas.getContext does not work`];
  return [renderingContext, 'Can init'];
}

const init = (elementId: string) => {
  const [renderingContext, msg] = canInit(elementId);
  if (!renderingContext) alert(msg);
  return renderingContext;
}

const renderingContext = init("elgame");
if (renderingContext) game(renderingContext);