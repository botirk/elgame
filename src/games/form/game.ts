import { InitSettings } from "../..";
import { LoadedImg } from "../../compileTime/generated";
import { formGame, FormGameDifficulty } from "../../settings";
import drawForm, { prepare, Prepared as PreparedDraw } from "./drawText";

const calcCardStep = (card: FormCard, dif: FormGameDifficulty) => {
  return dif.startCount + Math.floor(card.successCount / dif.stepCount);
}

const calcNextCard = (cards: FormCard[], previousCard?: FormCard): FormCard | undefined => {
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

  if (candidates.length > 0) {
    if (candidates.length >= 2 && previousCard) {
      const prevI = candidates.indexOf(previousCard);
      if (prevI != -1) candidates.splice(prevI, 1);
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
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

const calcNextForm = (state: FormState, dif: FormGameDifficulty, previousCard?: FormCard): [FormCard, FormCard[]] | [] => {
  if (state.gameplay.score.total >= state.gameplay.score.required) return [];
  const card = calcNextCard(state.gameplay.cards, previousCard);
  if (!card) return [];
  return [card, calcNextOthers(card, state, dif)];
}

const nextForm = (is: InitSettings, state: FormState, dif: FormGameDifficulty, previousCard?: FormCard) => {
  const [target, others] = calcNextForm(state, dif, previousCard);
  if (target && others) return new Promise<FormCard>((resolve) => {
    const [stopDrawing, redraw] = drawForm(is, state, target, others, (clickCard) => {
      if (clickCard == target) {
        clickCard.successCount += 1;
        state.gameplay.score.total += 1;
        state.gui.history.push(redraw);
      } else {
        state.gameplay.score.health -= 1;
      }
    }, (card) => resolve(card));
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
    }
    
  },
  // gui
  gui: {
    prepared: PreparedDraw,
    history: (() => void)[],
  },
  lastTick: number,
}

const form = async (is: InitSettings, dif: FormGameDifficulty) => {
  const state: FormState = {
    gameplay: {
      cards: is.prepared.fruits.map((fruit) => ({ ...fruit, successCount: 0 })),
      score: {
        total: 0, required: (dif.endCount + 1 - dif.startCount) * dif.stepCount * is.prepared.fruits.length,
        health: 3,
      }
    },
    gui: {
      prepared: prepare(is),
      history: [],
    },
    lastTick: 0,
  }

  const onFormEnd = (endCard?: FormCard) => {
    let form = nextForm(is, state, dif, endCard);
    if (form) form.then(onFormEnd);
    else if (state.gameplay.score.health >= 1) winAnimation(); 
    else gameEnder();
  }
  onFormEnd();

  // win
  const winAnimation = () => {
    setTimeout(() => {
      if (state.gui.history.length > 0) {
        (state.gui.history.pop() as () => void)();
        winAnimation();
      } else gameEnder();
    }, formGame.winTime / state.gameplay.score.required);
  }
  // promise magic
  let promiseResolve: (timeRemaining?: number) => void;
  const promise = new Promise<number | undefined>((resolve) => promiseResolve = resolve);
  // game ender
  const gameEnder = () => {
    promiseResolve(state.gameplay.score.health);
  };
  return await promise;
}

export default form;
