import { InitSettings } from "../..";
import { LoadedImg } from "../../compileTime/generated";
import { formGame, FormGameDifficulty } from "../../settings";
import drawForm, { prepare, Prepared as PreparedDraw } from "./drawText";

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

const nextForm = (is: InitSettings, state: FormState, dif: FormGameDifficulty, prevQuestion?: LoadedImg) => {
  const [target, others] = calcNextForm(state, formGame.difficulties.learning, prevQuestion);
  if (target && others) return new Promise<[boolean, FormCard]>((resolve) => {
    const [stopDrawing, redraw] = drawForm(is, state, target, others, (clickCard) => {
      stopDrawing(false);
      resolve([clickCard.name == target.name, clickCard]);
    });
  });
}

export interface FormCard extends LoadedImg {
  successCount: number,
}
export interface FormState {
  // gameplay
  gameplay: {
    cards: FormCard[],
    score: {
      total: number, required: number,
      health: number,
      lastHealthLostTime?: number, lastScoreIncreasedTime?: number,
    }
    
  },
  // gui
  gui: {
    prepared: PreparedDraw,
  },
  lastTick: number,
}

const form = async (is: InitSettings) => {
  const state: FormState = {
    gameplay: {
      cards: is.prepared.fruits.map((fruit) => ({ ...fruit, successCount: 0 })),
      score: {
        total: 0, required: 0,
        health: 3,
      }
    },
    gui: {
      prepared: prepare(is),
    },
    lastTick: 0,
  }

  const onFormEnd = ([ok, card]: [boolean, FormCard | undefined]) => {
    if (ok && card) card.successCount += 1;
    else if (!ok) state.gameplay.score.health -= 1;
    let form = nextForm(is, state, formGame.difficulties.learning, card);
    if (form) form.then(onFormEnd);
  }
  onFormEnd([true, undefined]);
}

export default form;
