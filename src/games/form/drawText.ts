import { Init } from "../../init";
import drawBackground from "../../gui/background";
import { calcTextWidth } from "../../gui/text";
import settings, { formGame } from "../../settings";
import { Word, WordWithImage } from "..";
import { FormCard, FormState } from "./game";
import { drawHealths, drawProgressBar, drawProgressBarFail, drawProgressBarSuccess, drawQuestText, drawStatusText, drawStatusTextFail, drawStatusTextSuccess, prepareHealths, prepareQuestText, prepareStatusText } from "../../gui/status";
import { Button } from "../../gui/button";
import Card from "./card";
import Form from "./form";

interface FormImg {
  card: FormCard,
  row: number, column: number,
}

export const prepare = (init: Init, words: WordWithImage[]) => {
  return {
    ...prepareStatusText(init),
    card: calculateCardSize(init, words),
  }
}
export type Prepared = ReturnType<typeof prepare>;

const calculateCardSize = (init: Init, words: WordWithImage[]) => {
  let minHeight = 0;
  let minWidth = 0;
  words.forEach((word) => {
    minHeight = Math.max(minHeight, word.toLearnImg.height + settings.gui.button.padding * 2);
    minWidth = Math.max(minWidth, word.toLearnImg.width + settings.gui.button.padding * 2);
  });
  return { minHeight, minWidth };
}

const calculateTable = (init: Init, state: FormState, words: WordWithImage[]) => {
  const gameWidth = init.prepared.gameWidth - settings.gui.margin * 2;
  let columns = Math.max(1, Math.floor(gameWidth / (state.gui.prepared.card.minWidth + settings.gui.margin)));
  const rows = Math.max(1, Math.ceil(words.length / columns));
  const lastRowColumns = words.length - (columns * (rows - 1));
  if (rows == 1) columns = lastRowColumns;
  // x 
  const totalWidth = columns * (state.gui.prepared.card.minWidth + settings.gui.margin) - settings.gui.margin;
  const widthRemaining = Math.max(0, init.prepared.gameWidth - totalWidth);
  const x = settings.gui.margin + state.gui.prepared.card.minWidth / 2 + widthRemaining / 2;
  // y
  const totalHeight = rows * (state.gui.prepared.card.minHeight + settings.gui.margin) - settings.gui.margin;
  const heightRemaining = Math.max(0, init.ctx.canvas.height - settings.gui.status.height - totalHeight);
  const y = settings.gui.status.height + state.gui.prepared.card.minHeight / 2 + heightRemaining / 2;

  return { columns, rows, lastRowColumns, start: { x, y } };
}

const shuffleCards = (init: Init, questions: FormCard[], tableSize: ReturnType<typeof calculateTable>): FormImg[] => {
  const freeCells: { row: number, column: number }[] = [];
  for (let row = 1; row < tableSize.rows; row++) {
    for (let column = 1; column <= tableSize.columns; column++) {
      freeCells.push({ row, column });
    }
  }
  for (let lastRowColumns = 1; lastRowColumns <= tableSize.lastRowColumns; lastRowColumns++) {
    freeCells.push({ row: tableSize.rows, column: lastRowColumns });
  }
  return questions.map((card) => {
    const cell = freeCells.splice(Math.floor(Math.random() * freeCells.length), 1)[0];
    return {
      card,
      ...cell,
    };
  });
}

const drawForm = (init: Init, state: FormState, quest: WordWithImage, falseAnswers: WordWithImage[], onClick: (card: WordWithImage) => void, onFinish: (card: WordWithImage) => void) => {
  return new Form(init, quest, falseAnswers, onClick, onFinish, state);
  
  /*drawBackground(init.ctx);
  drawStatusText(init, quest.word.toLearnText, state.gameplay.score.total, state.gameplay.score.required, state.gameplay.score.health, state.gui.prepared);
  // imgs
  const cards = [ quest, ...falseAnswers ];
  // sizes
  const tableSize = calculateTable(init, state, cards.map((card) => card.word));
  // shuffle
  const questions = shuffleCards(init, cards, tableSize);
  // form end
  let finishForm: () => void | undefined;
  // draw buttons
  const buttons = questions.map((q) => {
    const x = () => init.prepared.gameX + tableSize.start.x + (q.column - 1) * (state.gui.prepared.card.minWidth + settings.gui.margin);
    const y = () => tableSize.start.y + (q.row - 1) * (state.gui.prepared.card.minHeight + settings.gui.margin);
    return new Card(init, q.card, q.card === quest, x, y, () => false, function() {
      if (finishForm) {
        finishForm();
      } else {
        finishForm = () => {
          clearTimeout(finishTimeout);
          stop(true);
          onFinish(q.card);
        }
        const finishTimeout = setTimeout(finishForm, formGame.pause);
        onClick(q.card);
        redraw();
        return false;
      }
    });
  });

  const formState = (): boolean | undefined => {
    return false;
  }
  const stop = (shouldRedraw?: boolean) => buttons.forEach((btn) => btn.stop(shouldRedraw));
  const redraw = () => {
    drawBackground(init.ctx);
    const state = formState();
    if (isSuccess === undefined) {
      drawStatusText(init, quest.word.toLearnText, state.gameplay.score.total, state.gameplay.score.required, state.gameplay.score.health, state.gui.prepared);
    } else if (isSuccess === true) {
      drawStatusTextSuccess(init, quest.word.toLearnText, state.gameplay.score.health, state.gui.prepared);
    } else {
      drawStatusTextFail(init, quest.word.toLearnText, state.gameplay.score.health, state.gui.prepared);
    }
    buttons.forEach((btn) => btn.redraw());
  }
  const update = () => buttons.forEach((btn) => btn.dynamicPos());

  return { stop, redraw, update };*/
}

export default drawForm;
