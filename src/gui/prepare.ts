import gameJSON from "../compileTime/generated/game.json";
import fruitsJSON from "../compileTime/generated/fruits.json";

import { loadImgs } from "../compileTime/generated";
import settings from "../settings";

export const reprepare = (ctx: CanvasRenderingContext2D) => {
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

const prepare = async (ctx: CanvasRenderingContext2D) => {
  return {
    ...reprepare(ctx),
    imgs: await loadImgs(gameJSON, settings.hero.width, "width"),
    fruits: await loadImgs(fruitsJSON, settings.hero.width, "width"),
  }
}
export type Prepared = Awaited<ReturnType<typeof prepare>>;

export default prepare;
