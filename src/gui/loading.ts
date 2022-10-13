import { InitSettings } from "..";
import drawBackground from "./background";
import { drawTextAtCenter } from "./text";

const drawLoading = (is: InitSettings) => {
  drawBackground(is);
  is.ctx.fillStyle = is.colors.textColor;
  drawTextAtCenter(is, is.ctx.canvas.width / 2, is.ctx.canvas.height / 2, "...");
}

export default drawLoading;