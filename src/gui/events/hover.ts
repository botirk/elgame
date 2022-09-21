import settings from "../../settings";

interface HoverRequest {
  isInArea: (x: number, y: number) => boolean,
  onHover: () => void,
  onLeave: () => void,
  isCurrentlyInside?: boolean,
}

const hover = (ctx: CanvasRenderingContext2D) => {
  const requesters: HoverRequest[] = [];

  ctx.canvas.addEventListener("mousemove", (e) => {
    const [x, y] = settings.dimensions.toCanvasCoords(ctx, e.x, e.y);
    requesters.forEach((requester) => {
      if (!requester.isCurrentlyInside && requester.isInArea(x, y)) {
        requester.onHover();
        requester.isCurrentlyInside = true;
      } else if (requester.isCurrentlyInside && !requester.isInArea(x, y)) {
        requester.onLeave();
        requester.isCurrentlyInside = false;
      }
    });
  });

  const addRequest = (req: HoverRequest): () => void => {
    requesters.push(req);

    const removeRequest = () => {
      const i = requesters.indexOf(req);
      if (i != -1) requesters.splice(i, 1);
    }
    return removeRequest;
  }

  return addRequest;
}

export default hover;