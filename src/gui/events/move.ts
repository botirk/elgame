import settings from "../../settings";

type MoveRequest = (x: number, y: number) => void;

const move = (ctx: CanvasRenderingContext2D) => {
  const requesters: MoveRequest[] = [];

  ctx.canvas.addEventListener("mousemove", (e) => {
    const [x, y] = settings.dimensions.toCanvasCoords(ctx, e.x, e.y);
    requesters.forEach((req) => req(x, y));
  });
  ctx.canvas.addEventListener("touchmove", (e) => {
    const [x, y] = settings.dimensions.toCanvasCoords(ctx, e.touches[0].pageX, e.touches[0].pageY);
    requesters.forEach((req) => req(x, y)); 
  });

  const addRequest = (cb: MoveRequest) => {
    requesters.push(cb);
    
    const removeRequest = () => {
      const i = requesters.indexOf(cb);
      if (i != -1) requesters.splice(i, 1);
    }
    return removeRequest;
  }

  return addRequest;
}

export default move;