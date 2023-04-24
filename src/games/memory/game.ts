import { AbstractGame, EndGameStats } from "..";
import { Init } from "../../init";
import { removeRandomInArray } from "../../utils";
import settings from "../../settings";
import { memorySettings } from "./settings";
import { WordWithImage } from "..";
import Card, { GuessState } from "./card";
import { calcTextWidth } from "../../gui/text";
import { drawBackground } from "../../gui/background";
import { ButtonGroupGrid } from "../../gui/buttonGroup";

const calcCardSize = (init: Init, words: WordWithImage[]) => {
  let height = settings.fonts.fontSize + settings.gui.button.padding * 2;
  let width = settings.gui.button.padding * 2;
  words.forEach((img) => {
    height = Math.max(height, img.toLearnImg.height + settings.gui.button.padding * 2);
    width = Math.max(width, calcTextWidth(init.ctx, img.toLearnText) + settings.gui.button.padding * 2, img.toLearnImg.width + settings.gui.button.padding * 2);
  });
  return { height, width };
}

class Memory extends AbstractGame<WordWithImage[], ReturnType<typeof calcCardSize>, {}, EndGameStats> {
  private _remainingCards: number = this.content.length * 2;
  private _grid: ButtonGroupGrid<Card[]>;
  private _timer?: NodeJS.Timer;
  private _wonCards: Card[] = [];
  
  private finishCardAction() {
    for (const failed of this._grid.content.filter((card) => card.gameState == "failed")) {
      failed.gameState = "closed";
      failed.redraw();
    }
    for (const solvedOpen of this._grid.content.filter((card) => card.gameState == "solved&open")) {
      solvedOpen.gameState = "solved&closed";
      solvedOpen.redraw();
      if ((this._remainingCards -= 1) <= 0) {
        this.winAnimation();
        break;
      }
    }
  }
  private shuffleWords() {
    const result: { word: WordWithImage, guessState: GuessState }[] = [];
    const freePos: number[] = [];
    for (let i = 0; i < this.content.length * 2; i++) freePos.push(i);
    for (const word of this.content) {
      let pos: number | undefined;
      for (let tryCount = freePos.length * 5; tryCount > 0; tryCount -= 1) {
        pos = removeRandomInArray(freePos);
        if (tryCount > 1 && (result[pos-1]?.word === word || result[pos+1]?.word === word)) {
          freePos.push(pos);
          pos = undefined;
        } else {
          break;
        }
      }
      result[pos as number] = { word, guessState: "image" };

      pos = undefined;
      for (let tryCount = freePos.length * 5; tryCount > 0; tryCount -= 1) {
        pos = removeRandomInArray(freePos);
        if (tryCount > 1 && (result[pos-1]?.word === word || result[pos+1]?.word === word)) {
          freePos.push(pos);
          pos = undefined;
        } else {
          break;
        }
      }
      result[pos as number] = { word, guessState: "word" };
    }
    return result;
  }
  private async winAnimation() {
    await new Promise((resolve) => {
      setTimeout(resolve, memorySettings.winTime / this._wonCards.length);
    });
    for (const card of this._wonCards) {
      card.gameState = "solved&open";
      card.redraw();
      await new Promise((resolve) => {
        setTimeout(resolve, memorySettings.winTime / this._wonCards.length);
      });
    }
    this.stop({ isSuccess: true, name: "memory" });
  }
  protected start(): void {
    const this2 = this;
    this._grid = new ButtonGroupGrid(
      this.init, this.shuffleWords().map((shuffled, i) => new Card(
        this.init, shuffled.word, shuffled.guessState,
        this.prepared.width, this.prepared.height,
        function() {
          if (this2._remainingCards <= 0) return;
          // finish previous card animations
          clearTimeout(this2._timer);
          this2.finishCardAction();
          // register click only for closed cards
          if (this.gameState !== "closed") return;
          const open = this2._grid.content.filter((card) => card.gameState === "open");
          if (open.length === 0) {
            this.gameState = "open";
          } else if (open.length === 1) {
            if (open[0].word === this.word) {
              this.gameState = "solved&open";
              open[0].gameState = "solved&open";
              this2._wonCards.unshift(open[0]);
              this2._wonCards.unshift(this);
              this2.onProgressSuccess?.(this.word, []);
            } else {
              this.gameState = "failed";
              open[0].gameState = "failed";
            }
            open[0].redraw();
            this2._timer = setTimeout(() => this2.finishCardAction(), 2000);
          }
        })), 
      () => this.init.ctx.canvas.width / 2, () => settings.gui.status.height + (this.init.ctx.canvas.height - settings.gui.status.height) / 2,
    );
  }
  protected freeResources(): void {
    this._grid.stop();
    clearTimeout(this._timer);
  }
  protected prepare() {
    return calcCardSize(this.init, this.content);
  }
  protected preparePos() {
    return {};
  }
  protected redraw() {
    drawBackground(this.init.ctx);
    this._grid.redraw();
  }
  protected scrollOptions() {
    return { 
      oneStep: this._grid.itemHeight + settings.gui.button.padding, 
      maxHeight: this._grid.height + settings.gui.button.padding * 2 
    };
  }
  protected resize() {
    this._grid.dynamic();
  }
}

export default Memory;
