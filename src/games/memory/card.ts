import { WordWithImage } from "..";
import { Button } from "../../gui/button";
import { Init } from "../../init";
import settings from "../../settings";

export type GuessState = "image" | "word";
type GameState = "open" | "closed" | "failed" | "solved&open" | "solved&closed";

class Card extends Button {
  readonly guessState: GuessState;
  readonly word: WordWithImage;
  
  constructor(init: Init, word: WordWithImage, guessState: GuessState, minWidth: number, minHeight: number, onClick: (this: Card) => void) {
    super(init, "", 0, 0, { onClick, minWidth, minHeight });
    this.word = word;
    this.guessState = guessState;
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

