import settings from "../../settings";

interface ClickRequest {
  isInArea: (x: number, y: number) => boolean,
  isPressed?: boolean,
  onReleased: (isInside: boolean) => void,
  onPressed?: () => void,
  zIndex?: number,
}

export interface ClickManager {
  stop: () => void,
  isPressed: () => boolean,
}

const click = (ctx: CanvasRenderingContext2D) => {
  const requesters: ClickRequest[] = [];
  
  ctx.canvas.addEventListener("mousedown", (e) => { if (e.button == 0) {
    const [x, y] = settings.calculate.toCanvasCoords(ctx, e.x, e.y);
    const result: ClickRequest[] = [];
    let resultZIndex = -Infinity;
    requesters.forEach((requester) => {
      if (requester.isInArea(x, y)) {
        if ((requester.zIndex || 0) >= resultZIndex) {
          if ((requester.zIndex || 0) > resultZIndex) {
            resultZIndex = (requester.zIndex || 0);
            result.length = 0;
          }
          result.push(requester);
        }
      }
    });
    result.forEach((requester) => {
      requester.isPressed = true;
      requester.onPressed?.();
    });
  }});

  ctx.canvas.addEventListener("mouseup", (e) => { if (e.button == 0) {
    const [x, y] = settings.calculate.toCanvasCoords(ctx, e.x, e.y);
    requesters.forEach((requester) => {
      if (requester.isPressed) {
        requester.isPressed = false;
        requester.onReleased(requester.isInArea(x, y));
      }
    });
  }});

  const addRequest = (req: ClickRequest): ClickManager => {
    requesters.push(req);
    const stop = () => {
      const i = requesters.indexOf(req);
      if (i != -1) requesters.splice(i, 1);
      req.isPressed = false;
    }
    const isPressed = () => !!req.isPressed;
    return { stop, isPressed };
  }

  return addRequest;
}

export default click;