import { InitSettings } from "../settings";
import drawButton from "./button";
import { saveOldStyles } from "./utils";

const drawMenu = (is: InitSettings) => {
  const loadOldStyles = saveOldStyles(is.ctx);

  is.ctx.fillStyle = is.bgColor;
  is.ctx.fillRect(0, 0, is.ctx.canvas.width, is.ctx.canvas.height);
  drawButton(is, is.ctx.canvas.width / 2, 200, "Level 1", 111);
  drawButton(is, is.ctx.canvas.width / 2, 250, "Level 2", 111);
  drawButton(is, is.ctx.canvas.width / 2, 300, "Level 3", 111);
  is.ctx.fillText("Hello World!", 100, 100);

  loadOldStyles();
}

export default drawMenu;
