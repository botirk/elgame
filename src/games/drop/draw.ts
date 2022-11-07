import { InitSettings } from "../..";
import { WordWithImage } from "../word";
import drawBackground from "../../gui/background";
import { calcTextWidth } from "../../gui/text";
import settings, { dropGame } from "../../settings";
import { DropState } from "./game";

export const prepareQuestX = (is: InitSettings, quest: string) => {
  return is.prepared.gameX + (is.prepared.gameWidth - calcTextWidth(is.ctx, quest)) / 2
}
export const prepare = (is: InitSettings, quest: string) => {
  return {
    progressBarTextsY: (dropGame.progressBarY / 2 + settings.fonts.fontSize / 2),
    questX: prepareQuestX(is, quest),
  }
}
export type Prepared = ReturnType<typeof prepare>;

const drawGameBackground = (is: InitSettings) => {
  is.ctx.fillStyle = settings.colors.sky;
  is.ctx.fillRect(is.prepared.gameX, 0, is.prepared.gameWidth, settings.dimensions.heigth);
}

const drawWord = (is: InitSettings, word: WordWithImage, x: number, y: number) => {
  is.ctx.drawImage(word.toLearnImg, x, y, word.toLearnImg.width, word.toLearnImg.height);
}

const drawTargets = (is: InitSettings, state: DropState) => {
  state.gameplay.targets.a.forEach((target) => drawWord(is, target.word, target.x, target.y));
}

const drawHero = (is: InitSettings, state: DropState) => {
  is.ctx.fillStyle = "#03fc28";
  is.ctx.fillRect(state.gameplay.hero.x, state.gameplay.hero.y, settings.hero.width, settings.hero.height);
}

const drawHealth = (is: InitSettings, x: number, y: number) => {
  is.ctx.drawImage(is.prepared.imgs.heart, x, y, is.prepared.imgs.heart.width, is.prepared.imgs.heart.height);
}

const drawHealths = (is: InitSettings, state: DropState) => {
  const y = (dropGame.progressBarY - is.prepared.imgs.heart.height) / 2;
  const startX = state.gameplay.prepared.clickableGameXMax - is.prepared.imgs.heart.width;
  for (let i = state.gameplay.score.health; i > 0; i--) {
    drawHealth(is, startX - (state.gameplay.score.health - i) * (is.prepared.imgs.heart.width + 5), y);
  }
}

const drawQuest = (is: InitSettings, state: DropState) => {
  is.ctx.fillStyle = "black";
  is.ctx.font = settings.fonts.ctxFont;
  is.ctx.fillText(state.gameplay.quest.word.toLearnText, state.gui.prepared.questX, state.gui.prepared.progressBarTextsY);
}

const drawProgressBar = (is: InitSettings, state: DropState) => {
  // state
  const time = (state.gameplay.score.wonTime || state.gameplay.score.loseTime) ? (dropGame.difficulties.movie.targets.cd * 0.3) : state.gameplay.targets.cd * 0.3;
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
  is.ctx.fillRect(is.prepared.gameX, 0, is.prepared.gameWidth, dropGame.progressBarY);
  // bar
  if (!isSuccess && !isFail) {
    const progress = state.gameplay.score.total / state.gameplay.score.required;
    if (progress < 0.25) is.ctx.fillStyle = settings.colors.questColor1;
    else if (progress < 0.5) is.ctx.fillStyle = settings.colors.questColor2;
    else if (progress < 0.75) is.ctx.fillStyle = settings.colors.questColor3;
    else is.ctx.fillStyle = settings.colors.questColor4;
    is.ctx.fillRect(is.prepared.gameX, 0, is.prepared.gameWidth * progress, dropGame.progressBarY);
  }
}

const drawStatus = (is: InitSettings, state: DropState) => {
  drawProgressBar(is, state);
  drawHealths(is, state);
  drawQuest(is, state);
}

export const drawFrame = (is: InitSettings, state: DropState) => {
  drawBackground(is.ctx);
  drawGameBackground(is);
  drawHero(is, state);
  drawTargets(is, state);
  drawStatus(is, state);
}
