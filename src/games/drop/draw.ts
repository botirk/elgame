import { Init } from "../../init";
import { WordWithImage } from "..";
import drawBackground from "../../gui/background";
import { calcTextWidth } from "../../gui/text";
import settings, { dropGame } from "../../settings";
import { DropState } from "./game";

export const prepareQuestX = (init: Init, quest: string) => {
  return init.prepared.gameX + (init.prepared.gameWidth - calcTextWidth(init.ctx, quest)) / 2
}
export const prepare = (init: Init, quest: string) => {
  return {
    progressBarTextsY: (dropGame.progressBarY / 2 + settings.fonts.fontSize / 2),
    questX: prepareQuestX(init, quest),
  }
}
export type Prepared = ReturnType<typeof prepare>;

const drawGameBackground = (init: Init) => {
  init.ctx.fillStyle = settings.colors.sky;
  init.ctx.fillRect(init.prepared.gameX, 0, init.prepared.gameWidth, settings.dimensions.heigth);
}

const drawWord = (init: Init, word: WordWithImage, x: number, y: number) => {
  init.ctx.drawImage(word.toLearnImg, x, y, word.toLearnImg.width, word.toLearnImg.height);
}

const drawTargets = (init: Init, state: DropState) => {
  state.gameplay.targets.a.forEach((target) => drawWord(init, target.word, target.x, target.y));
}

const drawHero = (init: Init, state: DropState) => {
  init.ctx.fillStyle = "#03fc28";
  init.ctx.fillRect(state.gameplay.hero.x, state.gameplay.hero.y, settings.gui.icon.width, settings.gui.icon.height);
}

const drawHealth = (init: Init, x: number, y: number) => {
  init.ctx.drawImage(init.prepared.imgs.heart, x, y, init.prepared.imgs.heart.width, init.prepared.imgs.heart.height);
}

const drawHealths = (init: Init, state: DropState) => {
  const y = (dropGame.progressBarY - init.prepared.imgs.heart.height) / 2;
  const startX = state.gameplay.prepared.clickableGameXMax - init.prepared.imgs.heart.width;
  for (let i = state.gameplay.score.health; i > 0; i--) {
    drawHealth(init, startX - (state.gameplay.score.health - i) * (init.prepared.imgs.heart.width + 5), y);
  }
}

const drawQuest = (init: Init, state: DropState) => {
  init.ctx.fillStyle = "black";
  init.ctx.fillText(state.gameplay.quest.word.toLearnText, state.gui.prepared.questX, state.gui.prepared.progressBarTextsY);
}

const drawProgressBar = (init: Init, state: DropState) => {
  // state
  const time = (state.gameplay.score.wonTime || state.gameplay.score.loseTime) ? (dropGame.difficulties.movie.targets.cd * 0.3) : state.gameplay.targets.cd * 0.3;
  let isSuccess = ((state.gameplay.score?.lastScoreIncreasedTime || -10000) + time > state.lastTick);
  let isFail = ((state.gameplay.score?.lastHealthLostTime || -10000) + time  > state.lastTick);
  if (isSuccess && isFail) {
    isSuccess = (state.gameplay.score.lastScoreIncreasedTime || 0) > (state.gameplay.score?.lastHealthLostTime || 0);
    isFail = !isSuccess;
  }
  // bg
  if (isSuccess) init.ctx.fillStyle = settings.colors.success;
  else if (isFail) init.ctx.fillStyle = settings.colors.fail;
  else init.ctx.fillStyle = settings.colors.questColorBG;
  init.ctx.fillRect(init.prepared.gameX, 0, init.prepared.gameWidth, dropGame.progressBarY);
  // bar
  if (!isSuccess && !isFail) {
    const progress = state.gameplay.score.total / state.gameplay.score.required;
    if (progress < 0.25) init.ctx.fillStyle = settings.colors.questColor1;
    else if (progress < 0.5) init.ctx.fillStyle = settings.colors.questColor2;
    else if (progress < 0.75) init.ctx.fillStyle = settings.colors.questColor3;
    else init.ctx.fillStyle = settings.colors.questColor4;
    init.ctx.fillRect(init.prepared.gameX, 0, init.prepared.gameWidth * progress, dropGame.progressBarY);
  }
}

const drawStatus = (init: Init, state: DropState) => {
  drawProgressBar(init, state);
  drawHealths(init, state);
  drawQuest(init, state);
}

export const drawFrame = (init: Init, state: DropState) => {
  drawBackground(init.ctx);
  drawGameBackground(init);
  drawHero(init, state);
  drawTargets(init, state);
  drawStatus(init, state);
}
