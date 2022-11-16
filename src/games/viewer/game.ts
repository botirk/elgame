import { EndGameStats } from "..";
import { Init } from "../../init";
import drawBackground from "../../gui/background";
import { ButtonManager, drawIconButton, drawButton } from "../../gui/button";
import { calcTextWidth } from "../../gui/text";
import { promiseMagic } from "../../gui/utils";
import settings, { viewerGame } from "../../settings";
import { Word, WordWithImage } from "..";

const calculateTable = (init: Init, words: Word[]) => {
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
    wordColumnWidth = Math.max(wordColumnWidth, calcTextWidth(init.ctx, word.toLearnText) + settings.gui.button.padding * 2);
    if (word.toLearnImg) {
      rowHeight = Math.max(rowHeight, word.toLearnImg.height + settings.gui.button.padding * 2);
      imgColumnWidth = Math.max(imgColumnWidth, word.toLearnImg.width + settings.gui.button.padding * 2);
    }
    if (word.translation) translationColumnWidth = Math.max(translationColumnWidth, calcTextWidth(init.ctx, word.translation) + settings.gui.button.padding * 2);
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
  const beta  = init.ctx.canvas.width / 2 - totalWidth / 2;
  wordX += beta;
  translationX += beta;
  imgX += beta;
  // y coords
  let columnY = init.ctx.canvas.height / 2;
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

const viewer = (init: Init, words: Word[]) => async () => {
  const table = calculateTable(init, words);
  drawBackground(init.ctx);
  const buttons: ButtonManager[] = [];
  // words
  buttons.push(...words.map((word, i) => drawButton(
    init, () => table.wordX, () => table.columnY + ((table.rowHeight + viewerGame.margin) * i), word.toLearnText, 
    () => ({ likeLabel: true, minHeight: table.rowHeight, minWidth: table.wordColumnWidth }))
  ));
  // imgs
  buttons.push(...(words.filter((word) => word.toLearnImg) as WordWithImage[]).map((word, i) => drawIconButton(
    init, () => table.imgX, () => table.columnY + ((table.rowHeight + viewerGame.margin) * i), word.toLearnImg, 
    () => ({ likeLabel: true, minHeight: table.rowHeight, minWidth: table.imgColumnWidth })
  )));
  // clicks
  const stopClick = init.addClickRequest({ 
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
