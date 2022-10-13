import { InitSettings } from "..";

export const drawTextAtCenter = (is: InitSettings, x: number, y: number, text: string) => {
  is.ctx.font = is.fonts.ctxFont;
  const metrics = is.ctx.measureText(text);

  const textWidth = metrics.width;
  const textHeight = is.fonts.fontSize;
  const textX = (x - textWidth / 2), textY = (y + textHeight / 2);
  is.ctx.fillText(text, textX, textY);
}

export const calcTextWidth = (is: InitSettings, text: string) => {
  return is.ctx.measureText(text).width;
}

export const drawQuestAtCenter = (is: InitSettings, x: number, y: number, text: string) => {
  is.ctx.font = is.fonts.ctxFont;
  const textWidth = calcTextWidth(is, text);
  const textX = (x - textWidth / 2), textY = (y + is.fonts.fontSize / 2);
  is.ctx.fillStyle = is.colors.questColorText;
  is.ctx.fillText("! " + text, textX, textY);
}