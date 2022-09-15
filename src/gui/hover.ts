interface HoverRequest {
  isInArea: (x: number, y: number) => boolean,
  onHover: () => void,
  onLeave: () => void,
  isCurrentlyInside: boolean,
}

const hover = (ctx: CanvasRenderingContext2D) => {
  const requesters: HoverRequest[] = [];

  ctx.canvas.addEventListener("mousemove", (e) => {
    requesters.forEach((requester, i) => {
      if (!requester.isCurrentlyInside && requester.isInArea(e.x, e.y)) {
        requester.onHover();
        requester.isCurrentlyInside = true;
      } else if (requester.isCurrentlyInside && !requester.isInArea(e.x, e.y)) {
        requester.onLeave();
        requester.isCurrentlyInside = false;
      }
    });
  });

  const addHoverRequest = (isInArea: HoverRequest["isInArea"], isCurrentlyInside: HoverRequest["isCurrentlyInside"], onHover: HoverRequest["onHover"], onLeave: HoverRequest["onLeave"]): () => void => {
    const toAdd = { isInArea, isCurrentlyInside, onHover, onLeave };
    requesters[requesters.length] = toAdd;

    const removeHoverRequest = () => {
      const i = requesters.indexOf(toAdd);
      if (i != -1) requesters.splice(i, 1);
    }
    return removeHoverRequest;
  }

  return addHoverRequest;
}

export default hover;