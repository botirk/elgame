import { removeRandomInArray } from "../utils";
import { WordWithImage, AbstractGame, EndGameStats } from ".";
import { ButtonGroupGrid } from "../gui/buttonGroup";
import CTX from "../gui/CTX";
import { Button } from "../gui/button";
import { ResizeManager } from "../gui/events/resize";
import settings from "../settings";

type GuessState = "image" | "word";
type GameState = "open" | "closed" | "failed" | "solved&open" | "solved&closed";

class Card extends Button {
  constructor(ctx: CTX, readonly word: WordWithImage, readonly guessState: GuessState) {
    super(ctx);
  }

  private _gameState: GameState = "closed";
  get gameState() {
    return this._gameState;
  }
  set gameState(gameState: GameState) {
    if (this._gameState === gameState) return;
    this._gameState = gameState;
    if (gameState === "closed") {
      this.content = "";
    } else if (gameState === "failed" || gameState === "open" || gameState === "solved&open") {
      if (this.guessState === "word") {
        this.content = this.word.toLearnText;
      } else {
        this.content = this.word.toLearnImg;
      }
    }
    if (gameState == "failed") {
      this.bgColor = settings.colors.fail; 
    } else if (gameState == "solved&open") {
      this.bgColor = settings.colors.success;
    } else {
      this.bgColor = undefined;
    }
    if (gameState === "solved&closed") {
      this.justBorder = true;
    } else {
      this.justBorder = false;
    }
  }
}

const calcCardSize = (ctx: CTX, words: WordWithImage[]) => {
  let height = 0;
  let width = 0;
  words.forEach((img) => {
    const imgSize = Button.calcContentSize(ctx.ctx, img.toLearnImg);
    const textSize = Button.calcContentSize(ctx.ctx, img.toLearnText);
    height = Math.max(height, Button.calcHeight(Math.max(imgSize.height, textSize.height)));
    width = Math.max(width, Button.calcWidth(Math.max(imgSize.width, textSize.width)));
  });
  return { height, width };
}
 
export default class Memory extends AbstractGame<{ words: WordWithImage[] }, EndGameStats> {
  protected init(): void {
    const this2 = this;
    const cardSize = calcCardSize(this.ctx, this.content.words);
    this.grid = new ButtonGroupGrid(this.ctx);
    this.grid.content = this.shuffleWords().map((shuffled, i) => {
      const card = new Card(this.ctx, shuffled.word, shuffled.guessState);
      card.minHeight = cardSize.height;
      card.minWidth = cardSize.width;
      card.onClick = function() { this2.onCardClick(this); };
      return card;
    });
    const dynamic = () => {
      this.grid.xy(this.ctx.centerX(), this.ctx.centerY());
    };
    dynamic();
    this.resizeManager = this.ctx.resizeEvent.then({ update: () => { dynamic(); this.grid.screenResize(); }});
  }
  private async onCardClick(card: Card) {
    if (this._remainingCards <= 0) return;
    // finish previous card animations
    clearTimeout(this._timer);
    this.finishCardAction();
    // register click only for closed cards
    if (card.gameState !== "closed") return;
    const open = (this.grid.content as Card[]).filter((card) => card.gameState === "open");
    if (open.length === 0) {
      card.gameState = "open";
    } else if (open.length === 1) {
      if (open[0].word === card.word) {
        card.gameState = "solved&open";
        open[0].gameState = "solved&open";
        this.ctx.progress.saveProgressSuccess(card.word.toLearnText, []);
      } else {
        card.gameState = "failed";
        open[0].gameState = "failed";
      }
      this.ctx.redraw();
      this._timer = setTimeout(() => this.finishCardAction(), settings.memory.pairWaitTime);
    }
  }
  private finishCardAction() {
    for (const failed of (this.grid.content as Card[]).filter((card) => card.gameState == "failed")) {
      failed.gameState = "closed";
    }
    for (const solvedOpen of (this.grid.content as Card[]).filter((card) => card.gameState == "solved&open")) {
      solvedOpen.gameState = "solved&closed";
      if ((this._remainingCards -= 1) <= 0) {
        this.ctx.progress.saveProgressEnd("memory");
        this.stop();
        break;
      }
    }
    this.ctx.redraw();
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
  protected freeResources(): void {
    this.grid.stop();
    this.resizeManager();
    clearTimeout(this._timer);
  }
  protected innerRedraw() {
    this.ctx.drawBackground();
    this.grid.redraw();
  }

  private resizeManager: ResizeManager;
  private grid: ButtonGroupGrid<Card[]>;
  private _remainingCards: number = this.content.words.length * 2;
  private _timer?: NodeJS.Timer;
}

