import settings from "../settings";

const drawBackground = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = settings.colors.bg;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export default drawBackground;
