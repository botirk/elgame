
type ResizeRequest = () => void;

const resize = (ctx: CanvasRenderingContext2D) => {
  const requesters: ResizeRequest[] = [];
  let init = false;

  const resizeObserver = new ResizeObserver(() => {
    if (!init) init = true;
    else requesters.forEach((req) => req());
  });
  resizeObserver.observe(ctx.canvas);

  const addRequest = (cb: ResizeRequest) => {
    requesters.push(cb);
    
    const removeRequest = () => {
      const i = requesters.indexOf(cb);
      if (i != -1) requesters.splice(i, 1);
    }
    return removeRequest;
  }

  return addRequest;
}

export default resize;