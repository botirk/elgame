interface ClickRequest {
  isInArea: (x: number, y: number) => boolean,
  isPressed: boolean,
  onReleased: (isInside: boolean) => void,
  onPressed?: () => void,
}

const click = (ctx: CanvasRenderingContext2D) => {
  const requesters: ClickRequest[] = [];
  
  ctx.canvas.addEventListener("mousedown", (e) => {
    requesters.forEach((requester, i) => {
      if (requester.isInArea(e.x, e.y)) {
        requester.onPressed?.();
        requester.isPressed = true;
      }
    });
  });

  ctx.canvas.addEventListener("mouseup", (e) => {
    requesters.forEach((requester, i) => {
      if (requester.isPressed) {
        requester.onReleased(requester.isInArea(e.x, e.y));
      }
      requester.isPressed = false;
    });
  });

  const addClickRequest = (isInArea: ClickRequest["isInArea"], onReleased: ClickRequest["onReleased"], onPressed?: ClickRequest["onPressed"]) => {
    const toAdd = { isInArea, onReleased, onPressed, isPressed: false };
    requesters[requesters.length] = toAdd;
    
    const removeHoverRequest = () => {
      const i = requesters.indexOf(toAdd);
      if (i != -1) requesters.splice(i, 1);
    }
    return removeHoverRequest;
  }

  return addClickRequest;
}

export default click;