import { InitSettings } from "../..";
import { formGame, FormGameDifficulty } from "../../settings";
import drawForm, { prepare, Prepared as PreparedDraw } from "./drawText";
import { reprepare as reprepareGui } from "../../gui/prepare";
import { promiseMagic } from "../../gui/utils";
import { drawFullscreenButton } from "../../gui/button";
import { WordWithImage } from "../word";
import { EndGameStats } from "..";

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
  if (state.gameplay.score.health <= 0) return [];
  if (state.gameplay.score.total >= state.gameplay.score.required) return [];
  const card = calcNextCard(state.gameplay.cards, previousCard);
  if (!card) return [];
  return [card, calcNextOthers(card, state, dif)];
}

export interface FormCard {
  word: WordWithImage,
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
    winHistory: (() => void)[],
    loseHistory: (() => void)[],
  },
  lastTick: number,
}

const form = (is: InitSettings, words: WordWithImage[], dif: FormGameDifficulty) => async () => {
  const state: FormState = {
    gameplay: {
      cards: words.map((word) => ({ word, successCount: 0 })),
      score: {
        total: 0, required: (dif.endCount + 1 - dif.startCount) * dif.stepCount * words.length,
        health: 3,
      }
    },
    gui: {
      prepared: prepare(is, words),
      winHistory: [],
      loseHistory: [],
    },
    lastTick: 0,
  }

  let resizeCurrent: () => void | undefined;
  const stopResize = is.addResizeRequest(() => {
    is.prepared = { ...is.prepared, ...reprepareGui(is.ctx) };
    resizeCurrent?.();
    buttonFS.update();
    buttonFS.redraw();
  });
  const buttonFS = drawFullscreenButton(is, () => resizeCurrent?.());

  const nextForm = (previousCard?: FormCard) => {
    const [target, others] = calcNextForm(state, dif, previousCard);
    if (target && others) return new Promise<FormCard>((resolve) => {
      const form = drawForm(is, state, target, others, (clickCard) => {
        if (clickCard == target) {
          clickCard.successCount += 1;
          state.gameplay.score.total += 1;
          state.gui.winHistory.push(() => { form.update(); form.redraw(); });
        } else {
          state.gui.loseHistory.push(() => { form.update(); form.redraw(); });
          state.gameplay.score.health -= 1;
        }
      }, (card) => resolve(card));
      resizeCurrent = () => { form.update(); form.redraw(); };
    });
  }

  const onFormEnd = (endCard?: FormCard) => {
    let form = nextForm(endCard);
    if (form) form.then(onFormEnd);
    else endAnimation();
  }
  onFormEnd();

  // win
  const endAnimation = () => {
    const history = 
        (state.gameplay.score.health >= 1 && state.gui.winHistory.length > 0) ? state.gui.winHistory 
        : (state.gameplay.score.health <= 0 && state.gui.loseHistory.length > 0) ? state.gui.loseHistory
        : undefined;
    const totalScreens = (state.gameplay.score.health >= 1) ? state.gameplay.score.required : dif.maxHealth;
    
    if (history) (resizeCurrent = (history.pop() as () => void))(); else gameEnder({ isSuccess: state.gameplay.score.health >= 1 });
    setTimeout(endAnimation, formGame.endAnimationTime / totalScreens);
  }

  const [promise, gameEnder] = promiseMagic<EndGameStats>(() => {
    buttonFS.stop(false);
    stopResize();
  });
  return await promise;
}

export default form;
