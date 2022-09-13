import { bgColor } from "../game";
import drawButton from "./button";
import button from "./button";

const drawMenu = (ctx: CanvasRenderingContext2D) => {
  //ctx.fillStyle = bgColor;
  //ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
  drawButton(ctx, ctx.canvas.clientWidth / 2, 200, "Level 1", 111);
  drawButton(ctx, ctx.canvas.clientWidth / 2, 250, "Level 2", 111);
  drawButton(ctx, ctx.canvas.clientWidth / 2, 300, "Level 3", 111);
  //ctx.fillText("Hello World!", 100, 100);
}

export default drawMenu;
