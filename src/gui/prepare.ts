import settings from "../settings";

const prepare = (ctx: CanvasRenderingContext2D) => {
  // set height to fixed
  {
    const ratio = settings.dimensions.heigth / ctx.canvas.clientHeight;
    ctx.canvas.width = ctx.canvas.clientWidth * ratio;
    ctx.canvas.height = ctx.canvas.clientHeight * ratio;
  }
  // fix width
  const currentWidthToHeightRatio = ctx.canvas.width / ctx.canvas.height;
  if (currentWidthToHeightRatio < settings.dimensions.widthToHeightRatio) {
    ctx.canvas.width = ctx.canvas.height * settings.dimensions.widthToHeightRatio;
  }
  // add shadow
  ctx.shadowColor = "black";
  ctx.shadowBlur = 1;
  // calc
  const isMobile = settings.calculate.isMobile(currentWidthToHeightRatio);
  const gameWidth = settings.calculate.gameWidth(isMobile);
  // settings
  return {
    isMobile,
    gameWidth,
    gameX: settings.calculate.gameX(ctx, gameWidth),
    gameXMax: settings.calculate.gameXMax(ctx, gameWidth),
    verticalSpeedMultiplier: isMobile ? 1 : 1.33,
  };
}
export type Prepared = ReturnType<typeof prepare>;

export default prepare;
