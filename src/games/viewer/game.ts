import { InitSettings } from "../..";
import drawButton from "../../gui/button";
import { calcTextWidth } from "../../gui/text";
import settings, { viewerGame } from "../../settings";
import { Word } from "../word";

const calculateTable = (is: InitSettings, words: Word[]) => {
  let rowHeight = settings.fonts.fontSize;
  let wordColumnWidth = 0;
  let imgColumnWidth = 0;
  let translationColumnWidth = 0;
  words.forEach((word) => {
    wordColumnWidth = Math.max(wordColumnWidth, calcTextWidth(is.ctx, word.toLearnText));
    if (word.toLearnImg) {
      rowHeight = Math.max(rowHeight, word.toLearnImg.height);
      imgColumnWidth = Math.max(imgColumnWidth, word.toLearnImg.width);
    }
    if (word.translation) translationColumnWidth = Math.max(translationColumnWidth, calcTextWidth(is.ctx, word.translation));
  });

  const wordSize = settings.gui.button.padding * 2 + wordColumnWidth;
  let wordX = wordSize / 2, translationX = 0, imgX = 0;
  let totalWidth = wordSize;
  if (translationColumnWidth > 0) {
    const size = settings.gui.button.padding * 2 + translationColumnWidth;
    translationX = totalWidth + viewerGame.margin + size / 2;
    totalWidth += viewerGame.margin + size;
  }
  if (imgColumnWidth > 0) {
    const size = settings.gui.button.padding * 2 + imgColumnWidth;
    imgX = totalWidth + viewerGame.margin + size / 2;
    totalWidth += viewerGame.margin + size;
  }

  const beta  = is.ctx.canvas.width / 2 - totalWidth / 2;
  wordX += beta;
  translationX += beta;
  imgX += beta;

  return { wordX, wordColumnWidth, translationX, translationColumnWidth, imgX, imgColumnWidth, rowHeight };
}

const viewer = (is: InitSettings, words: Word[]) => async () => {
  const table = calculateTable(is, words);

  const x = (row: number) => 100;
  words.map((word, i) => drawButton(is, () => 0, () => x(i), () => 100, word.toLearnText));
}

export default viewer;
