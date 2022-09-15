import { InitSettings } from "../settings";
import { saveOldStyles } from "./utils";

const drawText = (is: InitSettings, x: number, y: number, text: string) => {
  const loadOldStyles = saveOldStyles(is.ctx);

  is.ctx.font = is.fonts.ctxFont;
  is.ctx.fillStyle = is.colors.textColor;
  is.ctx.fillText(text, x, y);

  loadOldStyles();
}

export default drawText;