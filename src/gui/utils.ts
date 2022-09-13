
export const saveOldStyles = (ctx: CanvasRenderingContext2D) => {
  const { fillStyle, font } = ctx;
  return () => { ctx.fillStyle = fillStyle, ctx.font = font; };
}
