type IsInArea = (x: number, y: number) => boolean;
type IsCurrentlyOutside = boolean;
type HoverResolver = () => void;

const hover = (ctx: CanvasRenderingContext2D) => {
  const requesters: [IsInArea, IsCurrentlyOutside, HoverResolver][] = [];
  
  ctx.canvas.addEventListener("mousemove", (e) => {
    requesters.forEach((requester, i) => {
      if ((requester[1] && requester[0](e.x, e.y)) || (!requester[1] && !requester[0](e.x, e.y))) {
        requester[2]();
        requesters.splice(i, 1);
      } 
    });
  });

  const addHoverRequest = (isInArea: IsInArea, isCurrentlyOutside: IsCurrentlyOutside): [Promise<void>, () => void] => {
    let resolver: () => void;
    const promise = new Promise((resolve) => resolver = resolve as () => void) as Promise<void>;
    resolver ||= () => 0;
    const toAdd:  [IsInArea, IsCurrentlyOutside, HoverResolver] = [isInArea, isCurrentlyOutside, resolver];
    requesters[requesters.length] = toAdd;
    
    const removeHoverRequest = () => {
      const i = requesters.indexOf(toAdd);
      if (i != -1) requesters.splice(requesters.indexOf(toAdd), i);
    }
    return [promise, removeHoverRequest];
  }

  return addHoverRequest;
}

export default hover;