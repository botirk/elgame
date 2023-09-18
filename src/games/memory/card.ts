import { WordWithImage } from "..";
import CTX from "../../gui/CTX";
import { Button } from "../../gui/button";
import settings from "../../settings";

export type GuessState = "image" | "word";
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

export default Card;

