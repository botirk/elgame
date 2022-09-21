import settings from "../../settings";

interface ClickRequest {
  isInArea: (x: number, y: number) => boolean,
  isPressed?: boolean,
  onReleased: (isInside: boolean) => void,
  onPressed?: () => void,
}

const click = (ctx: CanvasRenderingContext2D) => {
  const requesters: ClickRequest[] = [];
  
  ctx.canvas.addEventListener("mousedown", (e) => {
    const [x, y] = settings.dimensions.toCanvasCoords(ctx, e.x, e.y);
    requesters.forEach((requester) => {
      if (requester.isInArea(x, y)) {
        requester.onPressed?.();
        requester.isPressed = true;
      }
    });
  });

  ctx.canvas.addEventListener("mouseup", (e) => {
    const [x, y] = settings.dimensions.toCanvasCoords(ctx, e.x, e.y);
    requesters.forEach((requester) => {
      if (requester.isPressed) {
        requester.onReleased(requester.isInArea(x, y));
      }
      requester.isPressed = false;
    });
  });

  const addRequest = (req: ClickRequest) => {
    requesters.push(req);
    const removeRequest = () => {
      const i = requesters.indexOf(req);
      if (i != -1) requesters.splice(i, 1);
    }
    return removeRequest;
  }

  return addRequest;
}

export default click;