import { AbstractGame, EndGameStats } from "..";
import { Init } from "../../init";
import { calcTextWidth } from "../../gui/text";
import settings from "../../settings";
import { Word, WordWithImage } from "..";
import { Button } from "../../gui/button";
import { drawBackground } from "../../gui/background";
import { isLearnedForNow, untilNextLearnDate, WordProgress } from "../../learner";
import { ru } from "../../translation";
import AbstractButton from "../../gui/abstractButton";
import { ButtonWithDescription } from "../../gui/buttonWithDescription";

const wordLearning = (word: Word, progress: WordProgress) => {
  if (isLearnedForNow(word, progress)) {
    return {
      text: `${ru.BonusLearning} ${progress.words[word.toLearnText].stage}: ${untilNextLearnDate(word, progress)}`,
      updateRequired: true,
    };
  } else {
    return {
      text: `${ru.Learning} ${progress.words[word.toLearnText].stage}: ${Math.floor(progress.words[word.toLearnText].substage / 4 * 100)}%`,
      updateRequired: false,
    };
  }
}

const wordStats = (word: Word, progress: WordProgress): [string, string] => {
  return [`${ru.OfSuccesses}: ${progress.words[word.toLearnText].success}`, `${ru.OfFails}: ${progress.words[word.toLearnText].fail}`];
}

const calcTable = (init: Init, words: Word[], progress: WordProgress) => {
  // width + height of rows
  let rowHeight = 0;
  let wordColumnWidth = 0;
  let imgColumnWidth = 0;
  let translationColumnWidth = 0;
  let progressColumnWidth = 0;
  let statsColumnWidth = 0;
  words.forEach((word) => {
    wordColumnWidth = Math.max(wordColumnWidth, AbstractButton.calcWidth(Button.calcContentSize(init.ctx, word.toLearnText).width));
    rowHeight = Math.max(
      rowHeight, 
      AbstractButton.calcHeight(Button.calcContentSize(init.ctx, word.toLearnText).height), 
      AbstractButton.calcHeight(ButtonWithDescription.calcContentSize(init.ctx, ...wordStats(word, progress)).height)
    );
    progressColumnWidth = Math.max(progressColumnWidth, AbstractButton.calcWidth(Button.calcContentSize(init.ctx, wordLearning(word, progress).text).width));
    statsColumnWidth = Math.max(statsColumnWidth, AbstractButton.calcWidth(ButtonWithDescription.calcContentSize(init.ctx, ...wordStats(word, progress)).width));
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
  if (progressColumnWidth > 0) totalWidth += settings.gui.button.distance + progressColumnWidth;
  if (statsColumnWidth > 0) totalWidth += settings.gui.button.distance + statsColumnWidth;
  return {
    wordColumnWidth, translationColumnWidth, imgColumnWidth, progressColumnWidth, statsColumnWidth, rowHeight, columnHeight, totalWidth
  };
}

const calcTablePos = (init: Init, prepared: ReturnType<typeof calcTable>) => {
  // x coords
  let wordX = 0, translationX = 0, imgX = 0, progressX = 0, statsX = 0, curX = 0;
  if (prepared.wordColumnWidth > 0) {
    wordX = prepared.wordColumnWidth / 2;
    curX = prepared.wordColumnWidth;
  }
  if (prepared.translationColumnWidth > 0) {
    translationX = curX + settings.gui.button.distance + prepared.translationColumnWidth / 2;
    curX += settings.gui.button.distance + prepared.translationColumnWidth;
  } 
  if (prepared.imgColumnWidth > 0) {
    imgX = curX + settings.gui.button.distance + prepared.imgColumnWidth / 2;
    curX += settings.gui.button.distance + prepared.imgColumnWidth;
  }
  if (prepared.progressColumnWidth > 0) {
    progressX = curX + settings.gui.button.distance + prepared.progressColumnWidth / 2;
    curX += settings.gui.button.distance + prepared.progressColumnWidth;
  }
  if (prepared.statsColumnWidth > 0) {
    statsX = curX + settings.gui.button.distance + prepared.statsColumnWidth / 2;
    curX += settings.gui.button.distance + prepared.statsColumnWidth;
  }
  const beta  = init.ctx.canvas.width / 2 - prepared.totalWidth / 2;
  wordX += beta;
  translationX += beta;
  imgX += beta;
  progressX += beta;
  statsX += beta;
  // y coords
  let columnY = init.ctx.canvas.height / 2;
  if (prepared.columnHeight > 0) {
    columnY -= prepared.columnHeight / 2 - settings.gui.button.distance - prepared.rowHeight / 2;
    let min = settings.gui.button.distance + prepared.rowHeight / 2;
    if (columnY < min) columnY = min;
  }

  return {
    wordX, translationX, progressX, statsX, imgX, columnY, wordEnd: wordX + prepared.wordColumnWidth / 2, imgStart: imgX - prepared.imgColumnWidth / 2
  };
}

class Viewer extends AbstractGame<{ words: Word[], progress: WordProgress }, ReturnType<typeof calcTable>, ReturnType<typeof calcTablePos>, EndGameStats> {
  private _buttons: AbstractButton<any, any, any, any>[] = [];
  private _buttonUpdaters: (() => void)[] = [];
  private _timer: NodeJS.Timer;
  private _click = this.init.addClickRequest({
    isInArea: () => true,
    zIndex: -1000,
    onReleased: (isInside) => { if (isInside) this.stop({ isSuccess: true }); },
  });;
  
  protected start() {
    // text
    this._buttons.push(...this.content.words.map((word, i) => new Button(
      this.init, word.toLearnText, () => this.preparedPos.wordX, () => -this.scroll.pos + this.preparedPos.columnY + ((this.prepared.rowHeight + settings.gui.button.distance) * i),
      { likeLabel: true, minHeight: this.prepared.rowHeight, minWidth: this.prepared.wordColumnWidth }
    )));
    // imgs
    this._buttons.push(...(this.content.words.filter((word) => word.toLearnImg) as WordWithImage[]).map((word, i) => new Button(
      this.init, word.toLearnImg, () => this.preparedPos.imgX, () => -this.scroll.pos + this.preparedPos.columnY + ((this.prepared.rowHeight + settings.gui.button.distance) * i), 
      { likeLabel: true, minHeight: this.prepared.rowHeight, minWidth: this.prepared.imgColumnWidth }
    )));
    // progress state
    this._buttons.push(...this.content.words.map((word, i) => {
      let learning = wordLearning(word, this.content.progress);
      const btn = new Button(
        this.init, learning.text, () => this.preparedPos.progressX, () => -this.scroll.pos + this.preparedPos.columnY + ((this.prepared.rowHeight + settings.gui.button.distance) * i), 
        { likeLabel: true, minHeight: this.prepared.rowHeight, minWidth: this.prepared.progressColumnWidth }
      );
      if (learning.updateRequired) this._buttonUpdaters.push(() => {
        learning = wordLearning(word, this.content.progress);
        btn.content = learning.text;
        btn.redraw();
      });
      return btn;
    }));
    this._timer = setInterval(this.updateButton.bind(this), 1050);
    // stats
    this._buttons.push(...this.content.words.map((word, i) => {
      const [text, description] = wordStats(word, this.content.progress);
      return new ButtonWithDescription(
        this.init, { text, description }, () => this.preparedPos.statsX, () => -this.scroll.pos + this.preparedPos.columnY + ((this.prepared.rowHeight + settings.gui.button.distance) * i), 
        { likeLabel: true, minHeight: this.prepared.rowHeight, minWidth: this.prepared.statsColumnWidth }
      );
    }));
  }
  protected freeResources() {
    this._click.stop();
    for (const button of this._buttons) button.stop();
    clearInterval(this._timer);
  }
  protected redraw() {
    drawBackground(this.init.ctx);
    for (const button of this._buttons) button.redraw();
  }
  protected update() {
    for (const button of this._buttons) button.dynamic();
  }
  private updateButton() {
    for (const update of this._buttonUpdaters) update();
  }
  protected scrollOptions(): { oneStep: number; maxHeight: number; } {
    return {
      maxHeight: this.prepared.columnHeight,
      oneStep: this.prepared.rowHeight + settings.gui.button.distance,
    }
  }
  protected prepare() {
    return calcTable(this.init, this.content.words, this.content.progress);
  }
  protected preparePos() {
    return calcTablePos(this.init, this.prepared);
  }
}

export default Viewer;
