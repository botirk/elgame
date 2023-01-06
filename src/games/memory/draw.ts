import { Init } from "../../init";
import drawBackground from "../../gui/background";
import { drawButton, ButtonManager, drawIconButton } from "../../gui/button";
import { drawRoundedBorder, drawRoundedRect } from "../../gui/roundedRect";
import { calcTextWidth } from "../../gui/text";
import settings, { memoryGame } from "../../settings";
import { WordWithImage } from "..";
import { MemoryCard, MemoryState } from "./game";


type OnClick = (card: MemoryCard) => void;

const calculateCardSize = (init: Init, words: WordWithImage[]) => {
  let height = settings.fonts.fontSize + settings.gui.button.padding * 2;
  let width = settings.gui.button.padding * 2;
  words.forEach((img) => {
    height = Math.max(height, img.toLearnImg.height + settings.gui.button.padding * 2);
    width = Math.max(width, calcTextWidth(init.ctx, img.toLearnText) + settings.gui.button.padding * 2, img.toLearnImg.width + settings.gui.button.padding * 2);
  });
  return { height, width };
}

const calculateTable = (init: Init, words: WordWithImage[], cardSize: ReturnType<typeof calculateCardSize>) => {
  const gameWidth = init.prepared.gameWidth - memoryGame.margin * 2;
  let columns = Math.max(1, Math.floor(gameWidth / (cardSize.width + memoryGame.margin)));
  const rows = Math.max(1, Math.ceil((words.length * 2) / columns));
  const lastRowColumns = (words.length * 2) - (columns * (rows - 1));
  if (rows == 1) columns = lastRowColumns;
  // x 
  const totalWidth = columns * (cardSize.width + memoryGame.margin) - memoryGame.margin;
  const widthRemaining = Math.max(0, init.prepared.gameWidth - totalWidth);
  const x = memoryGame.margin + cardSize.width / 2 + widthRemaining / 2;
  // y
  const totalHeight = rows * (cardSize.height + memoryGame.margin) - memoryGame.margin;
  const heightRemaining = Math.max(0, init.ctx.canvas.height - totalHeight);
  const y = memoryGame.margin + cardSize.height / 2 + heightRemaining / 2;

  return { columns, rows, lastRowColumns, start: { x, y } };
}

export const prepare = (init: Init, words: WordWithImage[]) => {
  const card = calculateCardSize(init, words);
  return {
    card,
    ...calculateTable(init, words, card),
  };
}
export type Prepared = ReturnType<typeof prepare>;

const getCardBgColor = (card: MemoryCard) => {
  if (card.gameState == "failed") return settings.colors.fail; 
  else if (card.gameState == "solved&open") return settings.colors.success;
}

const drawCard = (init: Init, card: MemoryCard, state: MemoryState, onClick: OnClick): ButtonManager => {
  const x = () => init.prepared.gameX + state.gui.prepared.start.x + (card.column - 1) * (state.gui.prepared.card.width + memoryGame.margin);
  const y = () => state.gui.prepared.start.y + (card.row - 1) * (state.gui.prepared.card.height + memoryGame.margin);

  if (card.gameState == "closed") {
    return drawButton(
      init, x, y, "", () => ({ minWidth: state.gui.prepared.card.width, minHeight: state.gui.prepared.card.height, onClick: () => onClick(card) })
    );
  } else if (card.gameState == "open" || card.gameState == "failed" || card.gameState == "solved&open") {
    if (card.guessState == "word") {
      return drawButton(
        init, x, y, card.word.toLearnText,
        () => ({ minWidth: state.gui.prepared.card.width, minHeight: state.gui.prepared.card.height, bgColor: getCardBgColor(card), onClick: () => onClick(card) })
      );
    } else {
      return drawIconButton(
        init, x, y, card.word.toLearnImg,
        () => ({ minWidth: state.gui.prepared.card.width, minHeight: state.gui.prepared.card.height, bgColor: getCardBgColor(card), onClick: () => onClick(card) })
      );
    }
  } else {
    const redraw = () => {
      init.ctx.fillStyle = settings.colors.bg;
      drawRoundedRect(init.ctx, x() - state.gui.prepared.card.width / 2, y() - state.gui.prepared.card.height / 2, state.gui.prepared.card.width, state.gui.prepared.card.height, settings.gui.button.rounding);
      init.ctx.fillStyle = settings.colors.button.bg;
      drawRoundedBorder(init.ctx, x() - state.gui.prepared.card.width / 2, y() - state.gui.prepared.card.height / 2, state.gui.prepared.card.width, state.gui.prepared.card.height, settings.gui.button.rounding);
    }
    redraw();
    return { stop: () => {}, redraw, update: () => {} } as ButtonManager;
  }
}

const drawCards = (init: Init, state: MemoryState, onClick: OnClick) => {
  const redrawBtn = (i: number) => {
    const btn = buttons[i];
    if (btn) {
      // stop drawing
      btn.stop(false);
      // new draw
      const card = btn.card;
      buttons[i] = { ...drawCard(init, card, state, onClick), card };
    }
  }
  
  const buttons = state.gameplay.cards.map((card) => ({ ...drawCard(init, card, state, onClick), card }));
  const stop = () => buttons.forEach(({ stop }) => stop());
  const redraw = () => buttons.forEach(({ redraw }) => redraw());
  const update = () => buttons.forEach(({ update }) => update());
  const redrawCard = (card: MemoryCard) => redrawBtn(buttons.findIndex((btn) => btn.card == card));
  return { stop, redraw, update, redrawCard };
}

export const drawState = (init: Init, state: MemoryState, onClick: OnClick) => {
  drawBackground(init.ctx);

  const cards = drawCards(init, state, onClick);
  const redraw = () => {
    drawBackground(init.ctx);
    cards.redraw();
  }
  return { ...cards, redraw };
}