import { InitSettings } from "../..";
import drawBackground from "../../gui/background";
import drawButton, { drawIconButton } from "../../gui/button";
import { drawRoundedBorder, drawRoundedRect } from "../../gui/roundedRect";
import settings, { memoryGame } from "../../settings";
import { MemoryState } from "./game";

type Card = MemoryState["gameplay"]["cards"][0];
type OnClick = (card: Card) => void;

const drawCard = (is: InitSettings, card: Card, state: MemoryState, onClick: OnClick) => {
  const space = memoryGame.margin;
  const x = is.prepared.gameX + (card.column - 1) * (state.gameplay.prepared.card.width + space);
  const y = 50 + (card.row - 1) * (state.gameplay.prepared.card.height + space);

  if (card.gameState == "closed") {
    return drawButton(is, () => onClick(card), x, y, "", { width: state.gameplay.prepared.card.width, height: state.gameplay.prepared.card.height });
  } else if (card.gameState == "open" || card.gameState == "failed" || card.gameState == "solved&open") {
    let bgColor: string | undefined;
    if (card.gameState == "failed") bgColor = settings.colors.fail; else if (card.gameState == "solved&open") bgColor = settings.colors.success;
    if (card.guessState == "word") {
      return drawButton(is, () => onClick(card), x, y, card.img.name, { width: state.gameplay.prepared.card.width, height: state.gameplay.prepared.card.height, bgColor });
    } else {
      return drawIconButton(is, () => onClick(card), x, y, card.img.img, { width: state.gameplay.prepared.card.width, height: state.gameplay.prepared.card.height, bgColor });
    }
  } else {
    is.ctx.fillStyle = settings.colors.bg;
    drawRoundedRect(is.ctx, x - state.gameplay.prepared.card.width / 2, y - state.gameplay.prepared.card.height / 2, state.gameplay.prepared.card.width, state.gameplay.prepared.card.height, settings.gui.button.rounding);
    is.ctx.fillStyle = settings.colors.button.bg;
    drawRoundedBorder(is.ctx, x - state.gameplay.prepared.card.width / 2, y - state.gameplay.prepared.card.height / 2, state.gameplay.prepared.card.width, state.gameplay.prepared.card.height, settings.gui.button.rounding);
    return [() => {}, () => {}, () => {}] as ReturnType<typeof drawButton>;
  }
}

const drawCards = (is: InitSettings, state: MemoryState, onClick: OnClick) => {
  const redrawBtn = (i: number) => {
    const btn = buttons[i];
    if (btn) {
      // stop drawing
      const stopPrevDraw = btn[0];
      stopPrevDraw(false);
      // new draw
      const card = btn[3];
      buttons[i] = [...drawCard(is, card, state, onClick), card];
    }
  }
  const redrawCards = () => buttons.forEach((_, i) => redrawBtn(i));
  const redrawCard = (card: Card) => redrawBtn(buttons.findIndex((btn) => btn[3] == card));

  const buttons: [...ReturnType<typeof drawCard>, Card][] = state.gameplay.cards.map((card) => [...drawCard(is, card, state, onClick), card]);

  return [() => 0, redrawCards, redrawCard];
}

export const drawState = (is: InitSettings, state: MemoryState, onClick: OnClick) => {
  drawBackground(is.ctx);
  return drawCards(is, state, onClick);
}