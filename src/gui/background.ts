import settings from "../settings";
import { drawTextAtCenter } from "./text";

export const drawBackground = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = settings.colors.bg;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export const drawLoadingBackground = (ctx: CanvasRenderingContext2D) => {
  drawBackground(ctx);
  ctx.fillStyle = settings.colors.textColor;
  drawTextAtCenter(ctx, ctx.canvas.width / 2, ctx.canvas.height / 2, "...");
}
