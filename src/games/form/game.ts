import { InitSettings } from "../..";
import { LoadedImg } from "../../compileTime/generated";
import drawForm from "./drawText";

export interface FormCard {
  img: LoadedImg,
  successCount: number,
}
export interface FormState {
  // gameplay
  gameplay: {
    cards: FormCard[],
    solvedCards: number,
    score: {
      health: number,
      lastHealthLostTime?: number, lastScoreIncreasedTime?: number,
    }
    
  },
  // gui
  gui: {
    
  },
  lastTick: number,
}

const form = async (is: InitSettings) => {
  const state: FormState = {
    gameplay: {
      cards: [],
      solvedCards: 0,
      score: {
        health: 3,
      }
    },
    gui: {

    },
    lastTick: 0,
  }

  drawForm(is, state, is.prepared.fruits[0], is.prepared.fruits.slice(1), () => 0);
}

export default form;
