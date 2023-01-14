import { Init } from "../init";
import settings from "../settings";
import { calcTextWidth } from "./text";

interface PreparedQuestText {
  questTextY: number,
  questTextX: number,
};

export const prepareQuestText = (init: Init): PreparedQuestText => ({
  questTextY: (settings.gui.status.height + settings.fonts.fontSize) / 2,
  questTextX: (init.prepared.gameX + init.prepared.gameWidth / 2),
});

export const drawQuestText = (init: Init, text: string, prepared: PreparedQuestText) => {
  init.ctx.fillStyle = "black";
  init.ctx.fillText(text, prepared.questTextX - calcTextWidth(init.ctx, text) / 2, prepared.questTextY);
};

export const drawProgressBar = (init: Init, score: number, maxScore: number) => {
  // bg
  init.ctx.fillStyle = settings.colors.questColorBG;
  init.ctx.fillRect(0, 0, init.ctx.canvas.width, settings.gui.status.height);
  // bar
  const progress = score / maxScore;
  if (progress < 0.25) init.ctx.fillStyle = settings.colors.questColor1;
  else if (progress < 0.5) init.ctx.fillStyle = settings.colors.questColor2;
  else if (progress < 0.75) init.ctx.fillStyle = settings.colors.questColor3;
  else init.ctx.fillStyle = settings.colors.questColor4;
  init.ctx.fillRect(0, 0, init.ctx.canvas.width * progress, settings.gui.status.height);
};

export const drawProgressBarSuccess = (init: Init) => {
  init.ctx.fillStyle = settings.colors.success;
  init.ctx.fillRect(0, 0, init.ctx.canvas.width, settings.gui.status.height);
};

export const drawProgressBarFail = (init: Init) => {
  init.ctx.fillStyle = settings.colors.fail;
  init.ctx.fillRect(0, 0, init.ctx.canvas.width, settings.gui.status.height);
};

interface PreparedHealths {
  healthsY: number,
  healthsX: number,
  healthsTextY: number,
  healthsTextX: number,
};

export const prepareHealths = (init: Init): PreparedHealths => ({
  healthsY: (settings.gui.status.height - init.prepared.assets.heart.height) / 2,
  healthsX: (init.ctx.canvas.width - init.prepared.assets.heart.width - settings.gui.margin),
  healthsTextX: (init.ctx.canvas.width - init.prepared.assets.heart.width / 2 - settings.gui.margin),
  healthsTextY: settings.gui.status.height  - init.prepared.assets.heart.height / 2 - settings.fonts.fontSize
});

export const drawHealths = (init: Init, healths: number, prepared: PreparedHealths) => {
  if (healths > 3 || init.prepared.isMobile) {
    init.ctx.drawImage(init.prepared.assets.heart, prepared.healthsX, prepared.healthsY, init.prepared.assets.heart.width, init.prepared.assets.heart.height);
    const text = healths.toString();
    init.ctx.fillStyle = "black";
    init.ctx.fillText(text, prepared.healthsTextX - calcTextWidth(init.ctx, text)  / 2, prepared.healthsTextY);
  } else {
    for (let x = prepared.healthsX; healths > 0; healths--, x-= (init.prepared.assets.heart.width * 1.2)) {
      init.ctx.drawImage(init.prepared.assets.heart, x, prepared.healthsY, init.prepared.assets.heart.width, init.prepared.assets.heart.height);
    }
  }
};

interface PreparedStatusText extends PreparedHealths, PreparedQuestText {};

export const prepareStatusText = (init: Init): PreparedStatusText => ({
  ...prepareHealths(init),
  ...prepareQuestText(init),
});

export const drawStatusText = (init: Init, quest: string, score: number, maxScore: number, health: number, prepared: PreparedStatusText) => {
  drawProgressBar(init, score, maxScore);
  drawHealths(init, health, prepared);
  drawQuestText(init, quest, prepared);
};

export const drawStatusTextSuccess = (init: Init, quest: string, health: number, prepared: PreparedStatusText) => {
  drawProgressBarSuccess(init);
  drawHealths(init, health, prepared);
  drawQuestText(init, quest, prepared);
};

export const drawStatusTextFail = (init: Init, quest: string, health: number, prepared: PreparedStatusText) => {
  drawProgressBarFail(init);
  drawHealths(init, health, prepared);
  drawQuestText(init, quest, prepared);
};