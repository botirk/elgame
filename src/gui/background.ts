import { InitSettings } from "../settings";
import { saveOldStyles } from "./utils";

const drawBackground = (is: InitSettings) => {
  const loadOldStyles = saveOldStyles(is.ctx);

  is.ctx.fillStyle = is.colors.bgColor;
  is.ctx.fillRect(0, 0, is.ctx.canvas.width, is.ctx.canvas.height);

  loadOldStyles();
}

export default drawBackground;
