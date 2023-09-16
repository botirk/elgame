import { AbstractGame, EndGameStats, Word } from "..";
import { Init } from "../../init";
import { removeRandomInArray } from "../../utils";
import settings from "../../settings";
import { MemoryGameSetup, memorySettings } from "./settings";
import { WordWithImage } from "..";
import Card, { GuessState } from "./card";
import { calcTextWidth } from "../../gui/text";
import { drawBackground } from "../../gui/background";
import { ButtonGroupGrid } from "../../gui/buttonGroup";
import { drawStatusSimple, drawStatusSimpleFail, drawStatusSimpleSuccess, drawStatusText, prepareStatusText } from "../../gui/status1";

const calcCardSize = (init: Init, words: WordWithImage[]) => {
  let height = settings.fonts.fontSize + settings.gui.button.padding * 2;
  let width = settings.gui.button.padding * 2;
  words.forEach((img) => {
    height = Math.max(height, img.toLearnImg.height + settings.gui.button.padding * 2);
    width = Math.max(width, calcTextWidth(init.ctx, img.toLearnText) + settings.gui.button.padding * 2, img.toLearnImg.width + settings.gui.button.padding * 2);
  });
  return { height, width };
}

class Memory extends AbstractGame<{ words: WordWithImage[], setup: MemoryGameSetup }, ReturnType<typeof Memory.prepare>, {}, EndGameStats> {
  private _remainingCards: number = this.content.words.length * 2;
  private _grid: ButtonGroupGrid<Card[]>;
  private _timer?: NodeJS.Timer;
  private _wonCards: Card[] = [];
  private _health = this.content.setup.health;
  private _status?: "success" | "fail";
  
  private finishCardAction() {
    this._status = undefined;
    for (const failed of this._grid.content.filter((card) => card.gameState == "failed")) {
      failed.gameState = "closed";
    }
    for (const solvedOpen of this._grid.content.filter((card) => card.gameState == "solved&open")) {
      solvedOpen.gameState = "solved&closed";
      if ((this._remainingCards -= 1) <= 0) {
        this.winAnimation();
        break;
      }
    }
    if (this._health <= 0) {
      this.loseAnimation();
    }
    this.innerRedraw();
  }
  private shuffleWords() {
    const result: { word: WordWithImage, guessState: GuessState }[] = [];
    const freePos: number[] = [];
    for (let i = 0; i < this.content.words.length * 2; i++) freePos.push(i);
    for (const word of this.content.words) {
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
  private async loseAnimation() {
    const openTime = memorySettings.loseTime * 0.5;
    const seeTime = memorySettings.loseTime * 0.5;

    await new Promise((resolve) => {
      setTimeout(resolve, openTime / this._grid.content.length);
    });
    for (const card of this._wonCards) {
      card.gameState = "solved&open";
      card.redraw();
      await new Promise((resolve) => {
        setTimeout(resolve, openTime / this._grid.content.length);
      });
    }
    for (const card of this._grid.content) {
      if (card.gameState !== "solved&open") {
        card.gameState = "open";
        card.redraw();
        await new Promise((resolve) => {
          setTimeout(resolve, openTime / this._grid.content.length);
        });
      }
    }
    await new Promise((resolve) => {
      setTimeout(resolve, seeTime);
    });
    this.stop({ isSuccess: true, name: "memory" });
  }
  protected start(): void {
    const this2 = this;
    this._grid = new ButtonGroupGrid(
      this.init, this.shuffleWords().map((shuffled, i) => new Card(
        this.init, shuffled.word, shuffled.guessState,
        this.prepared.card.width, this.prepared.card.height,
        function() {
          if (this2._remainingCards <= 0 || this2._health <= 0) return;
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
              this2._status = "success";
            } else {
              this.gameState = "failed";
              open[0].gameState = "failed";
              this2._status = "fail";
              this2._health -= 1;
            }
            this2.innerRedraw();
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
  private static prepare(init: Init, words: WordWithImage[]) {
    return {
      card: calcCardSize(init, words),
      status: prepareStatusText(init),
    }
  }
  protected prepare() {
    return Memory.prepare(this.init, this.content.words);
  }
  protected preparePos() {
    return {};
  }
  protected innerRedraw() {
    drawBackground(this.init.ctx);
    this._grid.redraw();
    if (this._status === "success") 
      drawStatusSimpleSuccess(this.init, this._health, this.prepared.status);
    else if (this._status === "fail")
      drawStatusSimpleFail(this.init, this._health, this.prepared.status);
    else
      drawStatusSimple(this.init, this._health, this.prepared.status);
  }
  protected scrollOptions() {
    return { 
      oneStep: this._grid.itemHeight + settings.gui.button.padding, 
      maxHeight: this._grid.height + settings.gui.button.padding * 2 
    };
  }
  protected resize() {
    this._grid.screenResize();
  }
}

export default Memory;
