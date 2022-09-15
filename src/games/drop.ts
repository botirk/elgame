import { InitSettings } from "../settings";
import drawBackground from "../gui/background";
import { saveOldStyles } from "../gui/utils";

export const drawGameBackground = (is: InitSettings) => {
  const loadOldStyles = saveOldStyles(is.ctx);

  is.ctx.fillStyle = is.colors.skyColor;
  is.ctx.fillRect(is.ctx.canvas.width / 2 - is.calculated.gameWidth / 2, 0, is.calculated.gameWidth, is.ctx.canvas.height);

  loadOldStyles();
}

const width = 40;
const height = 40;
const drawHero = (is: InitSettings, x: number, y: number) => {
  const loadOldStyles = saveOldStyles(is.ctx);
  is.ctx.fillStyle = "#03fc28";
  
  is.ctx.fillRect(x - width / 2, y - height, width, height);

  loadOldStyles();
}

const drawDrop = (is: InitSettings) => {
  drawBackground(is);

  const state = {
    x: is.ctx.canvas.width / 2,
    y: 0,
    mouseX: -1,
  }

  const minX = is.calculated.gameXMin + width / 2;
  const maxX = is.calculated.gameXMax - width / 2;

  setInterval(() => {
    drawGameBackground(is);
    drawHero(is, state.x, state.y);
    state.y += is.dropGame.speed;
    if (state.y > is.ctx.canvas.height + height) state.y = 0;
    if (state.mouseX > -1) {
      if (state.x > state.mouseX) state.x = Math.max(state.x - is.dropGame.mouseSpeed, state.mouseX, minX);
      else state.x = Math.min(state.x + is.dropGame.mouseSpeed, state.mouseX, maxX);
    }
  }, 1000 / 100);

  is.ctx.canvas.addEventListener("mousemove", (e) => {
    state.mouseX = e.x;
  });
}

export default drawDrop;
