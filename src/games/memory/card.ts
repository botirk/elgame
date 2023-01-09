import { Word, WordWithImage } from "..";
import { Button } from "../../gui/button";
import { drawRoundedBorder, drawRoundedRect } from "../../gui/roundedRect";
import { Init } from "../../init";
import settings from "../../settings";
import { MemoryCard } from "./game";

export type GuessState = "image" | "word";
type GameState = "open" | "closed" | "failed" | "solved&open" | "solved&closed";

class Card extends Button {
  readonly guessState: GuessState;
  readonly word: WordWithImage;
  
  constructor(init: Init, word: WordWithImage, guessState: GuessState, x: () => number, y: () => number, width: number, height: number, onClick: (this: Card) => void, isLateGlue?: boolean) {
    super(init, "", x, y, {
      minHeight: height,
      minWidth: width,
      onClick,
    }, isLateGlue);
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

