import { InitSettings } from "../..";
import drawBackground from "../../gui/background";
import drawButton from "../../gui/button";
import drawRoundedRect from "../../gui/roundedRect";
import settings, { memoryGame } from "../../settings";
import { MemoryState } from "./game";

const drawCard = (is: InitSettings, card: MemoryState["gameplay"]["cards"][0], state: MemoryState) => {
  const space = memoryGame.margin;
  const size = state.gameplay.prepared.card.width;
  const x = is.prepared.gameX + (card.column - 1) * (size + space);
  const y = 50 + (card.row - 1) * (size + space);
  //drawRoundedRect(is.ctx, x, y, size, size, settings.gui.button.rounding);

  return drawButton(is, () => 0, x, y, card.img.name, size, state.gameplay.prepared.card.height);
}

const drawCards = (is: InitSettings, state: MemoryState) => {
  is.ctx.fillStyle = settings.colors.button.bg;
  const buttons = state.gameplay.cards.map((card) => drawCard(is, card, state));
}

export const drawState = (is: InitSettings, state: MemoryState) => {
  drawBackground(is.ctx);
  drawCards(is, state);
}