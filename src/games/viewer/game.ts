import { EndGameStats } from "..";
import { InitSettings } from "../..";
import drawBackground from "../../gui/background";
import drawButton, { ButtonManager, drawIconButton } from "../../gui/button";
import { calcTextWidth } from "../../gui/text";
import { promiseMagic } from "../../gui/utils";
import settings, { viewerGame } from "../../settings";
import { Word, WordWithImage } from "../word";

const calculateTable = (is: InitSettings, words: Word[]) => {
  // height / total height
  let rowHeight = settings.fonts.fontSize;
  let columnHeight = 0;
  // width of columns
  let wordColumnWidth = 0;
  let imgColumnWidth = 0;
  let translationColumnWidth = 0;
  words.forEach((word) => {
    if (columnHeight > 0) columnHeight += viewerGame.margin;
    columnHeight += settings.fonts.fontSize;
    wordColumnWidth = Math.max(wordColumnWidth, calcTextWidth(is.ctx, word.toLearnText) + settings.gui.button.padding * 2);
    if (word.toLearnImg) {
      rowHeight = Math.max(rowHeight, word.toLearnImg.height + settings.gui.button.padding * 2);
      imgColumnWidth = Math.max(imgColumnWidth, word.toLearnImg.width + settings.gui.button.padding * 2);
    }
    if (word.translation) translationColumnWidth = Math.max(translationColumnWidth, calcTextWidth(is.ctx, word.translation) + settings.gui.button.padding * 2);
  });
  // x coords
  let totalWidth = 0;
  let wordX = 0, translationX = 0, imgX = 0;
  if (wordColumnWidth > 0) {
    wordX = totalWidth + wordColumnWidth / 2;
    totalWidth += wordColumnWidth;
  }
  if (translationColumnWidth > 0) {
    translationX = totalWidth + viewerGame.margin + translationColumnWidth / 2;
    totalWidth += viewerGame.margin + translationColumnWidth;
  }
  if (imgColumnWidth > 0) {
    imgX = totalWidth + viewerGame.margin + imgColumnWidth / 2;
    totalWidth += viewerGame.margin + imgColumnWidth;
  }
  const beta  = is.ctx.canvas.width / 2 - totalWidth / 2;
  wordX += beta;
  translationX += beta;
  imgX += beta;
  // y coords
  let columnY = is.ctx.canvas.height / 2;
  let scrollNeeeded = false;
  if (columnHeight > 0) {
    columnY -= columnHeight / 2;
    let min = viewerGame.margin + settings.gui.button.padding + settings.fonts.fontSize / 2;
    if (columnY < min) {
      columnY = min;
      scrollNeeeded = true;
    }
  }

  return { wordX, wordColumnWidth, translationX, translationColumnWidth, imgX, imgColumnWidth, rowHeight, columnHeight, scrollNeeeded, columnY, 
    wordEnd: wordX + wordColumnWidth / 2, imgStart: imgX - imgColumnWidth / 2 };
}

const viewer = (is: InitSettings, words: Word[]) => async () => {
  const table = calculateTable(is, words);
  drawBackground(is.ctx);
  const buttons: ButtonManager[] = [];
  // words
  buttons.push(...words.map((word, i) => drawButton(
    is, () => table.wordX, () => table.columnY + ((table.rowHeight + viewerGame.margin) * i), word.toLearnText, 
    () => ({ likeLabel: true, height: table.rowHeight, minWidth: table.wordColumnWidth }))
  ));
  // imgs
  buttons.push(...(words.filter((word) => word.toLearnImg) as WordWithImage[]).map((word, i) => drawIconButton(
    is, () => table.imgX, () => table.columnY + ((table.rowHeight + viewerGame.margin) * i), word.toLearnImg, 
    () => ({ likeLabel: true, height: table.rowHeight, minWidth: table.imgColumnWidth })
  )));
  // clicks
  const stopClick = is.addClickRequest({ 
    isInArea: () => true, 
    onReleased: (isInside) => { if (isInside) gameEnder({ isSuccess: true }); },
  });
  
  const [promise, gameEnder] = promiseMagic<EndGameStats>(() => {
    stopClick();
    buttons.forEach((btn) => btn.stop(false));
  });
  return await promise;
}

export default viewer;
