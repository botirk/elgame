import { InitSettings } from "../settings";

const drawBackground = (is: InitSettings) => {
  is.ctx.fillStyle = is.colors.bgColor;
  is.ctx.fillRect(0, 0, is.ctx.canvas.width, is.ctx.canvas.height);
}

export default drawBackground;
