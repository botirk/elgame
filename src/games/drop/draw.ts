import { InitSettings } from "../..";
import { LoadedImg } from "../../compileTime/generated";
import { calcTextWidth } from "../../gui/text";
import settings from "../../settings";
import { DropState } from "./game";

export const prepareQuestX = (is: InitSettings, quest: string) => {
  return is.prepared.gameX + (is.prepared.gameWidth - calcTextWidth(is.ctx, quest)) / 2
}
export const prepare = (is: InitSettings, quest: string) => {
  return {
    progressBarTextsY: (settings.dropGame.progressBarY / 2 + settings.fonts.fontSize / 2),
    questX: prepareQuestX(is, quest),
  }
}
export type Prepared = ReturnType<typeof prepare>;

const drawGameBackground = (is: InitSettings) => {
  is.ctx.fillStyle = settings.colors.sky;
  is.ctx.fillRect(is.prepared.gameX, 0, is.prepared.gameWidth, settings.dimensions.heigth);
}

const drawWord = (is: InitSettings, word: LoadedImg, x: number, y: number) => {
  is.ctx.drawImage(word.img, x, y, word.img.width, word.img.height);
}

const drawTargets = (is: InitSettings, state: DropState) => {
  state.gameplay.targets.a.forEach((target) => drawWord(is, target.word, target.x, target.y));
}

const drawHero = (is: InitSettings, state: DropState) => {
  is.ctx.fillStyle = "#03fc28";
  is.ctx.fillRect(state.gameplay.hero.x, state.gameplay.hero.y, settings.hero.width, settings.hero.height);
}

const drawHealth = (is: InitSettings, x: number, y: number) => {
  is.ctx.drawImage(is.prepared.imgs.heart.img, x, y, is.prepared.imgs.heart.img.width, is.prepared.imgs.heart.img.height);
}

const drawHealths = (is: InitSettings, state: DropState) => {
  const y = (settings.dropGame.progressBarY - is.prepared.imgs.heart.img.height) / 2;
  const startX = state.gameplay.prepared.clickableGameXMax - is.prepared.imgs.heart.img.width;
  for (let i = state.gameplay.score.health; i > 0; i--) {
    drawHealth(is, startX - (state.gameplay.score.health - i) * (is.prepared.imgs.heart.img.width + 5), y);
  }
}

const drawQuest = (is: InitSettings, state: DropState) => {
  is.ctx.fillStyle = "black";
  is.ctx.font = settings.fonts.ctxFont;
  is.ctx.fillText(state.gameplay.quest.word.name, is.prepared.gameX + (is.prepared.gameWidth - calcTextWidth(is.ctx, state.gameplay.quest.word.name)) / 2, state.gui.prepared.progressBarTextsY);
}

const drawProgressBar = (is: InitSettings, state: DropState) => {
  // state
  const time = (state.gameplay.score.wonTime || state.gameplay.score.loseTime) ? (settings.dropGame.difficulties.movie.targets.cd * 0.3) : state.gameplay.targets.cd * 0.3;
  let isSuccess = ((state.gameplay.score?.lastScoreIncreasedTime || -10000) + time > state.lastTick);
  let isFail = ((state.gameplay.score?.lastHealthLostTime || -10000) + time  > state.lastTick);
  if (isSuccess && isFail) {
    isSuccess = (state.gameplay.score.lastScoreIncreasedTime || 0) > (state.gameplay.score?.lastHealthLostTime || 0);
    isFail = !isSuccess;
  }
  // bg
  if (isSuccess) is.ctx.fillStyle = settings.colors.success;
  else if (isFail) is.ctx.fillStyle = settings.colors.fail;
  else is.ctx.fillStyle = settings.colors.questColorBG;
  is.ctx.fillRect(is.prepared.gameX, 0, is.prepared.gameWidth, settings.dropGame.progressBarY);
  // bar
  if (!isSuccess && !isFail) {
    const progress = state.gameplay.score.total / state.gameplay.score.required;
    if (progress < 0.25) is.ctx.fillStyle = settings.colors.questColor1;
    else if (progress < 0.5) is.ctx.fillStyle = settings.colors.questColor2;
    else if (progress < 0.75) is.ctx.fillStyle = settings.colors.questColor3;
    else is.ctx.fillStyle = settings.colors.questColor4;
    is.ctx.fillRect(is.prepared.gameX, 0, is.prepared.gameWidth * progress, settings.dropGame.progressBarY);
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
