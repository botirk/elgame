import { drawButton } from "./button";

const drawMenu = (ctx: CanvasRenderingContext2D) => {
  drawButton(ctx, ctx.canvas.clientWidth / 2, ctx.canvas.clientHeight / 2, "Level 1");
}

const play = (ctx: CanvasRenderingContext2D) => {
  drawMenu(ctx);
}

export default play;