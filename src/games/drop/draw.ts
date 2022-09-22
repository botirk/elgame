import { InitSettings } from "../..";
import { LoadedImg } from "../../compileTime/generated";
import { DropState } from "./game";

const drawGameBackground = (is: InitSettings) => {
  is.ctx.fillStyle = is.colors.sky;
  is.ctx.fillRect(is.calculated.gameX, 0, is.calculated.gameWidth, is.dimensions.heigth);
}

const drawWord = (is: InitSettings, word: LoadedImg, x: number, y: number) => {
  is.ctx.drawImage(word.img, x, y, word.img.width, word.img.height);
}

const drawTargets = (is: InitSettings, state: DropState) => {
  state.gameplay.targets.a.forEach((target) => drawWord(is, target.word, target.x, target.y));
}

const drawHero = (is: InitSettings, state: DropState) => {
  is.ctx.fillStyle = "#03fc28";
  is.ctx.fillRect(state.gameplay.hero.x, state.gameplay.hero.y, is.hero.width, is.hero.height);
}

const drawHealth = (is: InitSettings, state: DropState, x: number, y: number) => {
  is.ctx.drawImage(state.gui.assets.heart.img, x, y, state.gui.assets.heart.img.width, state.gui.assets.heart.img.height);
}

const drawHealths = (is: InitSettings, state: DropState) => {
  const y = (is.dropGame.progressBarY - state.gui.assets.heart.img.height) / 2;
  const startX = is.calculated.clickableGameXMax - state.gui.assets.heart.img.width;
  for (let i = state.gameplay.score.health; i > 0; i--) {
    drawHealth(is, state, startX - (state.gameplay.score.health - i) * (state.gui.assets.heart.img.width + 5), y);
  }
}

const drawQuest = (is: InitSettings, state: DropState) => {
  is.ctx.fillStyle = "black";
  is.ctx.font = is.fonts.ctxFont;
  is.ctx.fillText(state.gameplay.quest.word.name, state.gameplay.quest.textX, state.gui.progressBarTextsY);
}

const drawProgressBar = (is: InitSettings, state: DropState) => {
  // state
  const time = (state.gameplay.score.wonTime || state.gameplay.score.loseTime) ? (is.dropGame.difficulties.movie.targets.cd * 0.3) : state.gameplay.targets.cd * 0.3;
  let isSuccess = ((state.gameplay.score?.lastScoreIncreasedTime || -10000) + time > state.lastTick);
  let isFail = ((state.gameplay.score?.lastHealthLostTime || -10000) + time  > state.lastTick);
  if (isSuccess && isFail) {
    isSuccess = (state.gameplay.score.lastScoreIncreasedTime || 0) > (state.gameplay.score?.lastHealthLostTime || 0);
    isFail = !isSuccess;
  }
  // bg
  if (isSuccess) is.ctx.fillStyle = is.colors.success;
  else if (isFail) is.ctx.fillStyle = is.colors.fail;
  else is.ctx.fillStyle = is.colors.questColorBG;
  is.ctx.fillRect(is.calculated.gameX, 0, is.calculated.gameWidth, is.dropGame.progressBarY);
  // bar
  if (!isSuccess && !isFail) {
    const progress = state.gameplay.score.total / state.gameplay.score.required;
    if (progress < 0.25) is.ctx.fillStyle = is.colors.questColor1;
    else if (progress < 0.5) is.ctx.fillStyle = is.colors.questColor2;
    else if (progress < 0.75) is.ctx.fillStyle = is.colors.questColor3;
    else is.ctx.fillStyle = is.colors.questColor4;
    is.ctx.fillRect(is.calculated.gameX, 0, is.calculated.gameWidth * progress, is.dropGame.progressBarY);
  }
}

const drawStatus = (is: InitSettings, state: DropState) => {
  drawProgressBar(is, state);
  drawHealths(is, state);
  drawQuest(is, state);
}

export const drawFrame = (is: InitSettings, state: DropState) => {
  drawGameBackground(is);
  drawHero(is, state);
  drawTargets(is, state);
  drawStatus(is, state);
}
