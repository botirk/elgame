import { InitSettings } from "../..";
import { LoadedImg } from "../../compileTime/generated";
import drawBackground from "../../gui/background";
import drawButton, { drawIconButton } from "../../gui/button";
import { drawRoundedBorder, drawRoundedRect } from "../../gui/roundedRect";
import { calcTextWidth } from "../../gui/text";
import settings, { memoryGame } from "../../settings";
import { MemoryCard, MemoryState } from "./game";


type OnClick = (card: MemoryCard) => void;

const calculateCardSize = (is: InitSettings, imgs: LoadedImg[]) => {
  let height = settings.fonts.fontSize + settings.gui.button.padding * 2;
  let width = settings.gui.button.padding * 2;
  is.ctx.font = settings.fonts.ctxFont;
  imgs.forEach((img) => {
    height = Math.max(height, img.img.height + settings.gui.button.padding * 2);
    width = Math.max(width, calcTextWidth(is.ctx, img.name) + settings.gui.button.padding * 2, img.img.width + settings.gui.button.padding * 2);
  });
  return { height, width };
}

const calculateTable = (is: InitSettings, imgs: LoadedImg[], cardSize: ReturnType<typeof calculateCardSize>) => {
  const gameWidth = is.prepared.gameWidth - memoryGame.margin * 2;
  let columns = Math.max(1, Math.floor(gameWidth / (cardSize.width + memoryGame.margin)));
  const rows = Math.max(1, Math.ceil((imgs.length * 2) / columns));
  const lastRowColumns = (imgs.length * 2) - (columns * (rows - 1));
  if (rows == 1) columns = lastRowColumns;
  // x 
  const totalWidth = columns * (cardSize.width + memoryGame.margin) - memoryGame.margin;
  const widthRemaining = Math.max(0, is.prepared.gameWidth - totalWidth);
  const x = memoryGame.margin + cardSize.width / 2 + widthRemaining / 2;
  // y
  const totalHeight = rows * (cardSize.height + memoryGame.margin) - memoryGame.margin;
  const heightRemaining = Math.max(0, is.ctx.canvas.height - totalHeight);
  const y = memoryGame.margin + cardSize.height / 2 + heightRemaining / 2;

  return { columns, rows, lastRowColumns, start: { x, y } };
}

export const prepare = (is: InitSettings) => {
  const card = calculateCardSize(is, is.prepared.fruits);
  return {
    card,
    ...calculateTable(is, is.prepared.fruits, card),
  };
}
export type Prepared = ReturnType<typeof prepare>;

const drawCard = (is: InitSettings, card: MemoryCard, state: MemoryState, onClick: OnClick): [(shouldRedraw: boolean) => void, () => void, () => void] => {
  const x = () => is.prepared.gameX + state.gui.prepared.start.x + (card.column - 1) * (state.gui.prepared.card.width + memoryGame.margin);
  const y = () => state.gui.prepared.start.y + (card.row - 1) * (state.gui.prepared.card.height + memoryGame.margin);

  if (card.gameState == "closed") {
    return drawButton(
      is, () => onClick(card), x, y, "", 
      () => ({ width: state.gui.prepared.card.width, height: state.gui.prepared.card.height })
    );
  } else if (card.gameState == "open" || card.gameState == "failed" || card.gameState == "solved&open") {
    let bgColor: string | undefined;
    if (card.gameState == "failed") bgColor = settings.colors.fail; else if (card.gameState == "solved&open") bgColor = settings.colors.success;
    if (card.guessState == "word") {
      return drawButton(
        is, () => onClick(card), x, y, card.img.name, 
        () => ({ width: state.gui.prepared.card.width, height: state.gui.prepared.card.height, bgColor })
      );
    } else {
      return drawIconButton(
        is, () => onClick(card), x, y, card.img.img,
        () => ({ width: state.gui.prepared.card.width, height: state.gui.prepared.card.height, bgColor })
      );
    }
  } else {
    const redraw = () => {
      is.ctx.fillStyle = settings.colors.bg;
      drawRoundedRect(is.ctx, x() - state.gui.prepared.card.width / 2, y() - state.gui.prepared.card.height / 2, state.gui.prepared.card.width, state.gui.prepared.card.height, settings.gui.button.rounding);
      is.ctx.fillStyle = settings.colors.button.bg;
      drawRoundedBorder(is.ctx, x() - state.gui.prepared.card.width / 2, y() - state.gui.prepared.card.height / 2, state.gui.prepared.card.width, state.gui.prepared.card.height, settings.gui.button.rounding);
    }
    redraw();
    return [() => {}, redraw, () => {}] as ReturnType<typeof drawButton>;
  }
}

const drawCards = (is: InitSettings, state: MemoryState, onClick: OnClick): [() => void, () => void, () => void, (card: MemoryCard) => void] => {
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
  
  const buttons: [...ReturnType<typeof drawCard>, MemoryCard][] = state.gameplay.cards.map((card) => [...drawCard(is, card, state, onClick), card]);
  const stopDraw = () => buttons.forEach((btn) => btn[0](false));
  const redraw = () => buttons.forEach((btn) => btn[1]());
  const move = () => buttons.forEach((btn) => btn[2]());
  const redrawCard = (card: MemoryCard) => redrawBtn(buttons.findIndex((btn) => btn[3] == card));
  return [stopDraw, redraw, move, redrawCard];
}

export const drawState = (is: InitSettings, state: MemoryState, onClick: OnClick): [() => void, () => void, () => void, (card: MemoryCard) => void] => {
  drawBackground(is.ctx);

  const stdReturn = drawCards(is, state, onClick);
  const redraw = () => {
    drawBackground(is.ctx);
    stdReturn[1]();
  }
  return [stdReturn[0], redraw, stdReturn[2], stdReturn[3]];
}