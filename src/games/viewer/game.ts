import { EndGameStats } from "..";
import { Init, reprepareInit } from "../../init";
import drawBackground from "../../gui/background";
import { calcTextWidth } from "../../gui/text";
import { promiseMagic } from "../../utils";
import settings, { viewerGame } from "../../settings";
import { Word, WordWithImage } from "..";
import Scroll from "../../gui/events/scroll";
import { Button } from "../../gui/button";
import FullscreenButton from "../../gui/fullscreenButton";

const calculateTable = (init: Init, words: Word[]) => {
  // width + height of rows
  let rowHeight = 0;
  let wordColumnWidth = 0;
  let imgColumnWidth = 0;
  let translationColumnWidth = 0;
  words.forEach((word) => {
    wordColumnWidth = Math.max(wordColumnWidth, calcTextWidth(init.ctx, word.toLearnText) + settings.gui.button.padding * 2);
    if (word.toLearnImg) {
      rowHeight = Math.max(rowHeight, word.toLearnImg.height + settings.gui.button.padding * 2);
      imgColumnWidth = Math.max(imgColumnWidth, word.toLearnImg.width + settings.gui.button.padding * 2);
    }
    if (word.translation) translationColumnWidth = Math.max(translationColumnWidth, calcTextWidth(init.ctx, word.translation) + settings.gui.button.padding * 2);
  });
  // height of column
  let columnHeight = 0;
  if (rowHeight > 0) columnHeight = settings.gui.button.distance + (settings.gui.button.distance + rowHeight) * words.length;
  // x coords
  let totalWidth = 0;
  let wordX = 0, translationX = 0, imgX = 0;
  if (wordColumnWidth > 0) {
    wordX = totalWidth + wordColumnWidth / 2;
    totalWidth += wordColumnWidth;
  }
  if (translationColumnWidth > 0) {
    translationX = totalWidth + settings.gui.button.distance + translationColumnWidth / 2;
    totalWidth += settings.gui.button.distance + translationColumnWidth;
  }
  if (imgColumnWidth > 0) {
    imgX = totalWidth + settings.gui.button.distance + imgColumnWidth / 2;
    totalWidth += settings.gui.button.distance + imgColumnWidth;
  }
  const beta  = init.ctx.canvas.width / 2 - totalWidth / 2;
  wordX += beta;
  translationX += beta;
  imgX += beta;
  // y coords
  let columnY = init.ctx.canvas.height / 2;
  if (columnHeight > 0) {
    columnY -= columnHeight / 2 - settings.gui.button.distance - rowHeight / 2;
    let min = settings.gui.button.distance + rowHeight / 2;
    if (columnY < min) columnY = min;
  }

  return {
    wordX, wordColumnWidth, translationX, translationColumnWidth, imgX, imgColumnWidth, rowHeight, columnHeight, 
    columnY, wordEnd: wordX + wordColumnWidth / 2, imgStart: imgX - imgColumnWidth / 2
  };
}

const viewer = (init: Init, words: Word[]) => async () => {
  let table = calculateTable(init, words);
  // scroll 
  const scroll = new Scroll(init, () => ({ 
    maxHeight: table.columnHeight,
    oneStep: table.rowHeight + settings.gui.button.distance, 
    update: () => dynamicPos(),
    redraw: () => redraw(),
  }));
  // words
  const buttons: Button[] = [];
  buttons.push(...words.map((word, i) => new Button(
    init, word.toLearnText, () => table.wordX, () => -scroll.pos() + table.columnY + ((table.rowHeight + settings.gui.button.distance) * i),
    { likeLabel: true, minHeight: table.rowHeight, minWidth: table.wordColumnWidth, lateGlue: true }
  )));
  // imgs
  buttons.push(...(words.filter((word) => word.toLearnImg) as WordWithImage[]).map((word, i) => new Button(
    init, word.toLearnImg, () => table.imgX, () => -scroll.pos() + table.columnY + ((table.rowHeight + settings.gui.button.distance) * i), 
    { likeLabel: true, minHeight: table.rowHeight, minWidth: table.imgColumnWidth, lateGlue: true }
  )));
  
  // clicks
  const click = init.addClickRequest({
    isInArea: () => true,
    zIndex: -1000,
    onReleased: (isInside) => { if (isInside) gameEnder({ isSuccess: true }); },
  });
  
  // resize
  const stopResize = init.addResizeRequest(() => {
    init.prepared = reprepareInit(init);
    table = calculateTable(init, words);
    scroll.update();
    dynamicPos();
    redraw();
  });

  const buttonFS = new FullscreenButton(init, () => redraw());

  // update
  const dynamicPos = () => { for (const button of buttons) button.dynamicPos(); }

  // redraw
  const redraw = () => {
    drawBackground(init.ctx);
    buttons.forEach((btn) => { btn.redraw(); });
    buttonFS.redraw();
  }
  // late glue activation
  redraw();
  scroll.drawScroll();
  
  const [promise, gameEnder] = promiseMagic<EndGameStats>(() => {
    click.stop();
    buttons.forEach((btn) => btn.stop(false));
    scroll.stop();
    stopResize();
    buttonFS.stop();
  });
  return await promise;
}

export default viewer;
