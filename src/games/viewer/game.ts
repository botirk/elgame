import { AbstractGame, EndGameStats } from "..";
import settings from "../../settings";
import { Word, WordWithImage } from "..";
import { Button } from "../../gui/button";
import { isLearnedForNow, untilNextLearnDate, Progress } from "../../learner";
import { ru } from "../../translation";
import { ButtonWithDescription } from "../../gui/buttonWithDescription";
import { ButtonGroupTable } from "../../gui/buttonGroup";

const wordLearning = (word: Word, progress: Progress) => {
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

const wordStats = (word: Word, progress: Progress) => {
  return { successes: `${ru.OfSuccesses}: ${progress.words[word.toLearnText].success}`, fails: `${ru.OfFails}: ${progress.words[word.toLearnText].fail}` };
}

class Viewer extends AbstractGame<{ words: Word[], progress: Progress }, {}, {}, EndGameStats> {
  private _table: ButtonGroupTable;
  private _buttonUpdaters: (() => void)[] = [];
  private _timer: NodeJS.Timer;
  private _click = this.init.addClickRequest({
    isInArea: () => true,
    zIndex: -1000,
    onReleased: () => this.stop({ isSuccess: true }),
  });

  protected start() {
    const table = this.content.words.map((word) => {
      const text = new Button(this.init, word.toLearnText, 0, 0,{ likeLabel: true });

      const img = new Button(this.init, (word as WordWithImage).toLearnImg, 0, 0, { likeLabel: true });

      // progress
      let learning = wordLearning(word, this.content.progress);
      const progress = new Button(this.init, learning.text, 0, 0, { likeLabel: true });
      if (learning.updateRequired) this._buttonUpdaters.push(() => {
        learning = wordLearning(word, this.content.progress);
        progress.content = learning.text;
        progress.redraw();
      });

      // stats
      const stats = wordStats(word, this.content.progress);
      const desc = new ButtonWithDescription(this.init, { text: stats.successes, description: stats.fails }, 0, 0, { likeLabel: true });

      return [text, img, progress, desc];
    });
    this._table = new ButtonGroupTable(
      this.init, table, 
      () => this.init.ctx.canvas.width / 2, () => this.init.ctx.canvas.height / 2, 
      { startX: 0, startY: settings.gui.button.distance }
    );
    this._timer = setInterval(this.updateButton.bind(this), 1050);
  }
  protected freeResources() {
    this._click.stop();
    this._table.stop();
    clearInterval(this._timer);
  }
  protected innerRedraw() {
    drawBackground(this.init.ctx);
    this._table.redraw();
  }
  protected resize() {
    this._table.screenResize();
  }
  private updateButton() {
    for (const update of this._buttonUpdaters) update();
  }
  protected scroll() {
    this._table.scroll = this.scrollEvent.pos;
    this._table.screenResize();
  }
  protected scrollOptions(): { oneStep: number; maxHeight: number; } {
    return {
      maxHeight: settings.gui.button.distance * 2 + this._table.height,
      oneStep: this._table.itemHeight,
    }
  }
  protected prepare() { return {}; }
  protected preparePos() { return {}; }
}

export default Viewer;
