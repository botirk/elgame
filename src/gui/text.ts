import settings from "../settings";

export const drawTextAtCenter = (ctx: CanvasRenderingContext2D, x: number, y: number, text: string) => {
  ctx.font = settings.fonts.ctxFont;
  const metrics = ctx.measureText(text);

  const textWidth = metrics.width;
  const textHeight = settings.fonts.fontSize;
  const textX = (x - textWidth / 2), textY = (y + textHeight / 2);
  ctx.fillText(text, textX, textY);
}

export const calcTextWidth = (ctx: CanvasRenderingContext2D, text: string) => {
  return ctx.measureText(text).width;
}