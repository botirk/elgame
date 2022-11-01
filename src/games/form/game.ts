import { InitSettings } from "../..";
import { LoadedImg } from "../../compileTime/generated";
import { formGame, FormGameDifficulty } from "../../settings";
import drawForm from "./drawText";

const calcCardStep = (card: FormCard, dif: FormGameDifficulty) => {
  return dif.startCount + Math.floor(card.successCount / dif.stepCount);
}

const calcNextCard = (cards: FormCard[]): FormCard | undefined => {
  let candidates: FormCard[] = [];
  let successCount = Infinity;

  cards.forEach((card) => {
    if (successCount > card.successCount) {
      successCount = card.successCount;
      candidates = [];
    }
    if (successCount == card.successCount) {
      candidates.push(card);
    }
  });

  
  if (candidates.length > 0) return candidates[Math.floor(Math.random() * candidates.length)];
}

const calcNextOthers = (card: FormCard, state: FormState, dif: FormGameDifficulty): FormCard[] => {
  const array = state.gameplay.cards.filter((cardf) => cardf != card);
  let currentIndex = array.length;
  while (currentIndex != 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex--);
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array.slice(0, calcCardStep(card, dif) - 1);
}

const calcNextForm = (state: FormState, dif: FormGameDifficulty, prevQuestion?: LoadedImg): [FormCard, FormCard[]] | [] => {
  const card = calcNextCard(state.gameplay.cards);
  if (!card) return [];
  return [card, calcNextOthers(card, state, dif)];
}

export interface FormCard extends LoadedImg {
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
      cards: is.prepared.fruits.map((fruit) => ({ ...fruit, successCount: 0 })),
      solvedCards: 0,
      score: {
        health: 3,
      }
    },
    gui: {

    },
    lastTick: 0,
  }

  const [target, others] = calcNextForm(state, formGame.difficulties.learning);
  if (target && others) drawForm(is, state, target, others, () => 0);
}

export default form;
