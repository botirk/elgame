import { Init } from "../../init";
import drawBackground from "../../gui/background";
import { ButtonManager, drawIconButton } from "../../gui/button";
import { calcTextWidth } from "../../gui/text";
import settings, { formGame } from "../../settings";
import { Word, WordWithImage } from "..";
import { FormCard, FormState } from "./game";

interface FormImg {
  card: FormCard,
  row: number, column: number,
}

export const prepare = (init: Init, words: WordWithImage[]) => {
  return {
    progressBarTextsY: (formGame.progressBarY / 2 + settings.fonts.fontSize / 2),
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
  const gameWidth = init.prepared.gameWidth - formGame.margin * 2;
  let columns = Math.max(1, Math.floor(gameWidth / (state.gui.prepared.card.minWidth + formGame.margin)));
  const rows = Math.max(1, Math.ceil(words.length / columns));
  const lastRowColumns = words.length - (columns * (rows - 1));
  if (rows == 1) columns = lastRowColumns;
  // x 
  const totalWidth = columns * (state.gui.prepared.card.minWidth + formGame.margin) - formGame.margin;
  const widthRemaining = Math.max(0, init.prepared.gameWidth - totalWidth);
  const x = formGame.margin + state.gui.prepared.card.minWidth / 2 + widthRemaining / 2;
  // y
  const totalHeight = rows * (state.gui.prepared.card.minHeight + formGame.margin) - formGame.margin;
  const heightRemaining = Math.max(0, init.ctx.canvas.height - formGame.progressBarY - totalHeight);
  const y = formGame.progressBarY + state.gui.prepared.card.minHeight / 2 + heightRemaining / 2;

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

const drawHealth = (init: Init, x: number, y: number) => {
  init.ctx.drawImage(init.prepared.imgs.heart, x, y, init.prepared.imgs.heart.width, init.prepared.imgs.heart.height);
}

const drawHealths = (init: Init, state: FormState) => {
  const y = (formGame.progressBarY - init.prepared.imgs.heart.height) / 2;
  const startX = init.ctx.canvas.width - init.prepared.imgs.heart.width - formGame.margin;
  for (let i = state.gameplay.score.health; i > 0; i--) {
    drawHealth(init, startX - (state.gameplay.score.health - i) * (init.prepared.imgs.heart.width + 5), y);
  }
}

const drawProgressBarSuccess = (init: Init) => {
  init.ctx.fillStyle = settings.colors.success;
  init.ctx.fillRect(0, 0, init.ctx.canvas.width, formGame.progressBarY);
}

const drawProgressBarFail = (init: Init) => {
  init.ctx.fillStyle = settings.colors.fail;
  init.ctx.fillRect(0, 0, init.ctx.canvas.width, formGame.progressBarY);
}

const drawProgressBar = (init: Init, state: FormState) => {
  // bg
  init.ctx.fillStyle = settings.colors.questColorBG;
  init.ctx.fillRect(0, 0, init.ctx.canvas.width, formGame.progressBarY);
  // bar
  const progress = state.gameplay.score.total / state.gameplay.score.required;
  if (progress < 0.25) init.ctx.fillStyle = settings.colors.questColor1;
  else if (progress < 0.5) init.ctx.fillStyle = settings.colors.questColor2;
  else if (progress < 0.75) init.ctx.fillStyle = settings.colors.questColor3;
  else init.ctx.fillStyle = settings.colors.questColor4;
  init.ctx.fillRect(0, 0, init.ctx.canvas.width * progress, formGame.progressBarY);
}

const drawQuest = (init: Init, state: FormState, quest: WordWithImage) => {
  init.ctx.fillStyle = "black";
  init.ctx.font = settings.fonts.ctxFont;
  init.ctx.fillText(quest.toLearnText, init.prepared.gameX + (init.prepared.gameWidth - calcTextWidth(init.ctx, quest.toLearnText)) / 2, state.gui.prepared.progressBarTextsY);
}

const drawStatus = (init: Init, state: FormState, quest: WordWithImage) => {
  drawProgressBar(init, state);
  drawHealths(init, state);
  drawQuest(init, state, quest);
}

const drawStatusSuccess = (init: Init, state: FormState, quest: WordWithImage) => {
  drawProgressBarSuccess(init);
  drawHealths(init, state);
  drawQuest(init, state, quest);
}

const drawStatusFail = (init: Init, state: FormState, quest: WordWithImage) => {
  drawProgressBarFail(init);
  drawHealths(init, state);
  drawQuest(init, state, quest);
}

const drawForm = (init: Init, state: FormState, quest: FormCard, falseAnswers: FormCard[], onClick: (card: FormCard) => void, onFinish: (card: FormCard) => void): ButtonManager => {
  drawBackground(init.ctx);
  drawStatus(init, state, quest.word);
  // imgs
  const cards = [ quest, ...falseAnswers ];
  // sizes
  const tableSize = calculateTable(init, state, cards.map((card) => card.word));
  // shuffle
  const questions = shuffleCards(init, cards, tableSize);
  // form end
  let finishTimeout: number | undefined;
  let clickedCard: FormCard | undefined;
  // draw buttons
  const buttons = questions.map((q) => {
    const x = () => init.prepared.gameX + tableSize.start.x + (q.column - 1) * (state.gui.prepared.card.minWidth + formGame.margin);
    const y = () => tableSize.start.y + (q.row - 1) * (state.gui.prepared.card.minHeight + formGame.margin);
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
            button.update();
            button.redraw();
          }
        },
      })
    );
    return button;
  });

  const stop = (shouldRedraw: boolean) => buttons.forEach((btn) => btn.stop(shouldRedraw));
  const redraw = () => {
    drawBackground(init.ctx);
    if (clickedCard && clickedCard == quest) {
      drawStatusSuccess(init, state, quest.word);
    } else if (clickedCard && clickedCard != quest) {
      drawStatusFail(init, state, quest.word);
    } else {
      drawStatus(init, state, quest.word);
    }
    buttons.forEach((btn) => btn.redraw());
  }
  const move = () => buttons.forEach((btn) => btn.update());

  return { stop, redraw, update: move };
}

export default drawForm;
