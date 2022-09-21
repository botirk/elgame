import { InitSettings } from "../..";
import { LoadedImg } from "../../compileTime/generated";
import { DropState } from "./game";

const drawGameBackground = (is: InitSettings, state: DropState) => {
  is.ctx.fillStyle = is.colors.skyColor;
  is.ctx.fillRect(is.calculated.gameX, 0, is.calculated.gameWidth, is.dimensions.heigth);
}

const drawWord = (is: InitSettings, word: LoadedImg, x: number, y: number) => {
  is.ctx.drawImage(word.img, x, y, word.img.width, word.img.height);
}

const drawTargets = (is: InitSettings, state: DropState) => {
  state.targets.forEach((target) => drawWord(is, target.word, target.x, target.y));
}

const drawHero = (is: InitSettings, state: DropState) => {
  is.ctx.fillStyle = "#03fc28";
  is.ctx.fillRect(state.heroX, state.heroY, is.hero.width, is.hero.height);
}

const drawHealth = (is: InitSettings, state: DropState, x: number, y: number) => {
  is.ctx.drawImage(state.assets.heart.img, x, y, state.assets.heart.img.width, state.assets.heart.img.height);
}

const drawHealths = (is: InitSettings, state: DropState) => {
  const y = (is.dropGame.progressBarY - state.assets.heart.img.height) / 2;
  const startX = is.calculated.clickableGameXMax - state.assets.heart.img.width;
  for (let i = state.health; i > 0; i--) {
    drawHealth(is, state, startX - (state.health - i) * (state.assets.heart.img.width + 5), y);
  }
}

const drawQuest = (is: InitSettings, state: DropState) => {
  is.ctx.fillStyle = "black";
  is.ctx.font = is.fonts.ctxFont;
  is.ctx.fillText(state.quest.word.name, state.quest.textX, state.progressBarTextsY);
}

const drawProgressBar = (is: InitSettings, state: DropState) => {
  is.ctx.fillStyle = is.colors.questColorBG;
  is.ctx.fillRect(is.calculated.gameX, 0, is.calculated.gameWidth, is.dropGame.progressBarY);
  const progress = state.currentSuccessCount / state.requiredSuccessCount;
  if (progress < 0.25) is.ctx.fillStyle = is.colors.questColor1;
  else if (progress < 0.5) is.ctx.fillStyle = is.colors.questColor2;
  else if (progress < 0.75) is.ctx.fillStyle = is.colors.questColor3;
  else is.ctx.fillStyle = is.colors.questColor4;
  is.ctx.fillRect(is.calculated.gameX, 0, is.calculated.gameWidth * progress, is.dropGame.progressBarY);
  drawHealths(is, state);
  drawQuest(is, state);
}

const drawWin = (is: InitSettings, state: DropState) => {

}

export const drawFrame = (is: InitSettings, state: DropState) => {
  drawGameBackground(is, state);
  drawHero(is, state);
  drawTargets(is, state);
  drawProgressBar(is, state);
}
