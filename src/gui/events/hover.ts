import settings from "../../settings";

interface HoverRequest {
  isInArea: (x: number, y: number) => boolean,
  onHover: () => void,
  onLeave: () => void,
  isCurrentlyInside?: boolean,
}

export interface HoverManager {
  stop: () => void,
  update: () => void,
  isInArea: () => boolean,
}

const hover = (ctx: CanvasRenderingContext2D) => {
  const requesters: HoverRequest[] = [];
  const lastPos = { x: Infinity, y: Infinity };

  ctx.canvas.addEventListener("mousemove", (e) => {
    [lastPos.x, lastPos.y] = settings.calculate.toCanvasCoords(ctx, e.x, e.y);
    requesters.forEach((req) => {
      if (!req.isCurrentlyInside && req.isInArea(lastPos.x, lastPos.y)) {
        req.isCurrentlyInside = true;
        req.onHover();
        
      } else if (req.isCurrentlyInside && !req.isInArea(lastPos.x, lastPos.y)) {
        req.isCurrentlyInside = false;
        req.onLeave();
      }
    });
  });

  const addRequest = (req: HoverRequest): HoverManager => {
    const update = () => {
      req.isCurrentlyInside = req.isInArea(lastPos.x, lastPos.y);
    }
    if (req.isCurrentlyInside === undefined) update();
    const stop = () => {
      const i = requesters.indexOf(req);
      if (i != -1) requesters.splice(i, 1);
      req.isCurrentlyInside = false;
    }
    const isInArea = () => !!req.isCurrentlyInside;
    requesters.push(req);
    return { stop, isInArea, update };
  }

  return addRequest;
}

export default hover;