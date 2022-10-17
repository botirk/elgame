import settings from "../settings";
import drawBackground from "./background";
import { drawTextAtCenter } from "./text";

const drawLoading = (ctx: CanvasRenderingContext2D) => {
  drawBackground(ctx);
  ctx.fillStyle = settings.colors.textColor;
  drawTextAtCenter(ctx, ctx.canvas.width / 2, ctx.canvas.height / 2, "...");
}

export default drawLoading;