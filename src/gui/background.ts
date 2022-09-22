import { InitSettings } from "../index";

const drawBackground = (is: InitSettings) => {
  is.ctx.fillStyle = is.colors.bg;
  is.ctx.fillRect(0, 0, is.ctx.canvas.width, is.ctx.canvas.height);
}

export default drawBackground;
