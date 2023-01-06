import { Init } from "../../init";
import drawBackground from "../../gui/background";
import { ButtonManager, drawIconButton } from "../../gui/button";
import { calcTextWidth } from "../../gui/text";
import settings, { formGame } from "../../settings";
import { Word, WordWithImage } from "..";
import { FormCard, FormState } from "./game";
import { drawHealths, drawProgressBar, drawProgressBarFail, drawProgressBarSuccess, drawQuestText, drawStatusText, drawStatusTextFail, drawStatusTextSuccess, prepareHealths, prepareQuestText, prepareStatusText } from "../../gui/status";

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

const drawForm = (init: Init, state: FormState, quest: FormCard, falseAnswers: FormCard[], onClick: (card: FormCard) => void, onFinish: (card: FormCard) => void): ButtonManager => {
  drawBackground(init.ctx);
  drawStatusText(init, quest.word.toLearnText, state.gameplay.score.total, state.gameplay.score.required, state.gameplay.score.health, state.gui.prepared);
  // imgs
  const cards = [ quest, ...falseAnswers ];
  // sizes
  const tableSize = calculateTable(init, state, cards.map((card) => card.word));
  // shuffle
  const questions = shuffleCards(init, cards, tableSize);
  // form end
  let finishTimeout: NodeJS.Timeout | undefined;
  let clickedCard: FormCard | undefined;
  // draw buttons
  const buttons = questions.map((q) => {
    const x = () => init.prepared.gameX + tableSize.start.x + (q.column - 1) * (state.gui.prepared.card.minWidth + settings.gui.margin);
    const y = () => tableSize.start.y + (q.row - 1) * (state.gui.prepared.card.minHeight + settings.gui.margin);
    const bgColor = () => {
      if (clickedCard == q.card) {
        if (clickedCard == quest) return settings.colors.success;
        else return settings.colors.fail;
      }
    }
    const button = drawIconButton(
      init, x, y, q.card.word.toLearnImg, () => ({ 
        ...state.gui.prepared.card, 
        bgColor: bgColor(),
        onClick: () => {
          if (finishTimeout) {
            clearTimeout(finishTimeout);
            stop(true);
            onFinish(q.card);
          } else {
            clickedCard = q.card;
            onClick(q.card);
            finishTimeout = setTimeout(() => { 
              stop(true);
              onFinish(q.card);
            }, formGame.pause);
            button.update(true);
            button.redraw();
            return false;
          }
        },
      })
    );
    return button;
  });

  const stop = (shouldRedraw?: boolean) => buttons.forEach((btn) => btn.stop(shouldRedraw));
  const redraw = () => {
    drawBackground(init.ctx);
    if (clickedCard && clickedCard == quest) {
      drawStatusTextSuccess(init, quest.word.toLearnText, state.gameplay.score.health, state.gui.prepared);
    } else if (clickedCard && clickedCard != quest) {
      drawStatusTextFail(init, quest.word.toLearnText, state.gameplay.score.health, state.gui.prepared);
    } else {
      drawStatusText(init, quest.word.toLearnText, state.gameplay.score.total, state.gameplay.score.required, state.gameplay.score.health, state.gui.prepared);
    }
    buttons.forEach((btn) => btn.redraw());
  }
  const update = (everything?: boolean, dontUpdateHover?: boolean) => buttons.forEach((btn) => btn.update(everything, dontUpdateHover));

  return { stop, redraw, update };
}

export default drawForm;
