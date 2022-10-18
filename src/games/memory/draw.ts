import { InitSettings } from "../..";
import drawBackground from "../../gui/background";
import drawRoundedRect from "../../gui/roundedRect";
import settings from "../../settings";
import { MemoryState } from "./game";

const drawCards = (is: InitSettings, state: MemoryState) => {
  const space = 20;
  const size = 50;
  const start = is.prepared.gameX;
  is.ctx.fillStyle = settings.colors.button.bg;
  state.gameplay.cards.forEach((card) => {
    const x = start + (card.column - 1) * (size + space);
    drawRoundedRect(is.ctx, x, 50, size, size, settings.gui.button.rounding);
  });
}

export const drawState = (is: InitSettings, state: MemoryState) => {
  drawBackground(is.ctx);
  drawCards(is, state);
}