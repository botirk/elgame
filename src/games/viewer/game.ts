import { AbstractGame, EndGameStats } from "..";
import { Init } from "../../init";
import drawBackground from "../../gui/background";
import { calcTextWidth } from "../../gui/text";
import settings from "../../settings";
import { Word, WordWithImage } from "..";
import { Button } from "../../gui/button";

const calcTable = (init: Init, words: Word[]) => {
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
  if (wordColumnWidth > 0) totalWidth += wordColumnWidth;
  if (translationColumnWidth > 0) totalWidth += settings.gui.button.distance + translationColumnWidth;
  if (imgColumnWidth > 0) totalWidth += settings.gui.button.distance + imgColumnWidth;
  return {
    wordColumnWidth, translationColumnWidth, imgColumnWidth, rowHeight, columnHeight, totalWidth
  };
}

const calcTablePos = (init: Init, prepared: ReturnType<typeof calcTable>) => {
  // x coords
  let wordX = 0, translationX = 0, imgX = 0;
  if (prepared.wordColumnWidth > 0) wordX = prepared.wordColumnWidth / 2;
  if (prepared.translationColumnWidth > 0) translationX = prepared.totalWidth / 2;
  if (prepared.imgColumnWidth > 0) imgX = prepared.totalWidth - prepared.imgColumnWidth / 2;
  const beta  = init.ctx.canvas.width / 2 - prepared.totalWidth / 2;
  wordX += beta;
  translationX += beta;
  imgX += beta;
  // y coords
  let columnY = init.ctx.canvas.height / 2;
  if (prepared.columnHeight > 0) {
    columnY -= prepared.columnHeight / 2 - settings.gui.button.distance - prepared.rowHeight / 2;
    let min = settings.gui.button.distance + prepared.rowHeight / 2;
    if (columnY < min) columnY = min;
  }

  return {
    wordX, translationX, imgX, columnY, wordEnd: wordX + prepared.wordColumnWidth / 2, imgStart: imgX - prepared.imgColumnWidth / 2
  };
}

class Viewer extends AbstractGame<Word[], ReturnType<typeof calcTable>, ReturnType<typeof calcTablePos>, EndGameStats> {
  private _buttons: Button[] = [];
  private _click = this.init.addClickRequest({
    isInArea: () => true,
    zIndex: -1000,
    onReleased: (isInside) => { if (isInside) this.stop({ isSuccess: true }); },
  });;
  constructor(init: Init, words: Word[]) {
    super(init, words, true);
    this.start();
  }
  protected start() {
    // draw background
    drawBackground(this.init.ctx);
    // text
    this._buttons.push(...this.content.map((word, i) => new Button(
      this.init, word.toLearnText, () => this.preparedPos.wordX, () => -this.scroll.pos + this.preparedPos.columnY + ((this.prepared.rowHeight + settings.gui.button.distance) * i),
      { likeLabel: true, minHeight: this.prepared.rowHeight, minWidth: this.prepared.wordColumnWidth, lateGlue: true }
    )));
    // imgs
    this._buttons.push(...(this.content.filter((word) => word.toLearnImg) as WordWithImage[]).map((word, i) => new Button(
      this.init, word.toLearnImg, () => this.preparedPos.imgX, () => -this.scroll.pos + this.preparedPos.columnY + ((this.prepared.rowHeight + settings.gui.button.distance) * i), 
      { likeLabel: true, minHeight: this.prepared.rowHeight, minWidth: this.prepared.imgColumnWidth, lateGlue: true }
    )));
  }
  protected freeResources() {
    this._click.stop();
    for (const button of this._buttons) button.stop();
  }
  protected redraw() {
    drawBackground(this.init.ctx);
    for (const button of this._buttons) button.redraw();
  }
  protected update() {
    for (const button of this._buttons) button.dynamicPos();
  }
  protected scrollOptions(): { oneStep: number; maxHeight: number; } {
    return {
      maxHeight: this.prepared.columnHeight,
      oneStep: this.prepared.rowHeight + settings.gui.button.distance,
    }
  }
  protected prepare() {
    return calcTable(this.init, this.content);
  }
  protected preparePos() {
    return calcTablePos(this.init, this.prepared);
  }
}

export default Viewer;
