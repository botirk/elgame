import settings from "../../settings";

interface HoverRequest {
  isInArea: (x: number, y: number) => boolean,
  onHover: () => void,
  onLeave: () => void,
  isCurrentlyInside?: boolean,
}

interface HoverRequestPlus extends HoverRequest {
  lastPos: [number, number],
}

export interface HoverManager {
  stop: () => void,
  update: () => void,
  isInArea: () => boolean,
}

const hover = (ctx: CanvasRenderingContext2D) => {
  const requesters: HoverRequestPlus[] = [];

  ctx.canvas.addEventListener("mousemove", (e) => {
    const pos = settings.calculate.toCanvasCoords(ctx, e.x, e.y);
    requesters.forEach((req) => {
      req.lastPos = pos;
      if (!req.isCurrentlyInside && req.isInArea(...req.lastPos)) {
        req.isCurrentlyInside = true;
        req.onHover();
      } else if (req.isCurrentlyInside && !req.isInArea(...req.lastPos)) {
        req.isCurrentlyInside = false;
        req.onLeave();
      }
    });
  });

  const addRequest = (req: HoverRequest): HoverManager => {
    const newReq: HoverRequestPlus = { ...req, lastPos: [-Infinity, -Infinity] };
    requesters.push(newReq);
    
    const stop = () => {
      const i = requesters.indexOf(newReq);
      if (i != -1) requesters.splice(i, 1);
      newReq.isCurrentlyInside = false;
    }
    const isInArea = () => !!newReq.isCurrentlyInside;
    const update = () => { newReq.isCurrentlyInside = newReq.isInArea(...newReq.lastPos); };

    return { stop, isInArea, update };
  }

  return addRequest;
}

export default hover;