import { InitSettings } from "../..";
import drawBackground from "../../gui/background";
import { ButtonManager, drawIconButton } from "../../gui/button";
import { calcTextWidth } from "../../gui/text";
import settings, { formGame } from "../../settings";
import { Word, WordWithImage } from "../word";
import { FormCard, FormState } from "./game";

interface FormImg {
  card: FormCard,
  row: number, column: number,
}

export const prepare = (is: InitSettings, words: WordWithImage[]) => {
  return {
    progressBarTextsY: (formGame.progressBarY / 2 + settings.fonts.fontSize / 2),
    card: calculateCardSize(is, words),
  }
}
export type Prepared = ReturnType<typeof prepare>;

const calculateCardSize = (is: InitSettings, words: WordWithImage[]) => {
  let height = 0;
  let width = 0;
  words.forEach((word) => {
    height = Math.max(height, word.toLearnImg.height + settings.gui.button.padding * 2);
    width = Math.max(width, word.toLearnImg.width + settings.gui.button.padding * 2);
  });
  return { height, width };
}

const calculateTable = (is: InitSettings, state: FormState, words: WordWithImage[]) => {
  const gameWidth = is.prepared.gameWidth - formGame.margin * 2;
  let columns = Math.max(1, Math.floor(gameWidth / (state.gui.prepared.card.width + formGame.margin)));
  const rows = Math.max(1, Math.ceil(words.length / columns));
  const lastRowColumns = words.length - (columns * (rows - 1));
  if (rows == 1) columns = lastRowColumns;
  // x 
  const totalWidth = columns * (state.gui.prepared.card.width + formGame.margin) - formGame.margin;
  const widthRemaining = Math.max(0, is.prepared.gameWidth - totalWidth);
  const x = formGame.margin + state.gui.prepared.card.width / 2 + widthRemaining / 2;
  // y
  const totalHeight = rows * (state.gui.prepared.card.height + formGame.margin) - formGame.margin;
  const heightRemaining = Math.max(0, is.ctx.canvas.height - formGame.progressBarY - totalHeight);
  const y = formGame.progressBarY + state.gui.prepared.card.height / 2 + heightRemaining / 2;

  return { columns, rows, lastRowColumns, start: { x, y } };
}

const shuffleCards = (is: InitSettings, questions: FormCard[], tableSize: ReturnType<typeof calculateTable>): FormImg[] => {
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

const drawHealth = (is: InitSettings, x: number, y: number) => {
  is.ctx.drawImage(is.prepared.imgs.heart, x, y, is.prepared.imgs.heart.width, is.prepared.imgs.heart.height);
}

const drawHealths = (is: InitSettings, state: FormState) => {
  const y = (formGame.progressBarY - is.prepared.imgs.heart.height) / 2;
  const startX = is.ctx.canvas.width - is.prepared.imgs.heart.width - formGame.margin;
  for (let i = state.gameplay.score.health; i > 0; i--) {
    drawHealth(is, startX - (state.gameplay.score.health - i) * (is.prepared.imgs.heart.width + 5), y);
  }
}

const drawProgressBarSuccess = (is: InitSettings) => {
  is.ctx.fillStyle = settings.colors.success;
  is.ctx.fillRect(0, 0, is.ctx.canvas.width, formGame.progressBarY);
}

const drawProgressBarFail = (is: InitSettings) => {
  is.ctx.fillStyle = settings.colors.fail;
  is.ctx.fillRect(0, 0, is.ctx.canvas.width, formGame.progressBarY);
}

const drawProgressBar = (is: InitSettings, state: FormState) => {
  // bg
  is.ctx.fillStyle = settings.colors.questColorBG;
  is.ctx.fillRect(0, 0, is.ctx.canvas.width, formGame.progressBarY);
  // bar
  const progress = state.gameplay.score.total / state.gameplay.score.required;
  if (progress < 0.25) is.ctx.fillStyle = settings.colors.questColor1;
  else if (progress < 0.5) is.ctx.fillStyle = settings.colors.questColor2;
  else if (progress < 0.75) is.ctx.fillStyle = settings.colors.questColor3;
  else is.ctx.fillStyle = settings.colors.questColor4;
  is.ctx.fillRect(0, 0, is.ctx.canvas.width * progress, formGame.progressBarY);
}

const drawQuest = (is: InitSettings, state: FormState, quest: WordWithImage) => {
  is.ctx.fillStyle = "black";
  is.ctx.font = settings.fonts.ctxFont;
  is.ctx.fillText(quest.toLearnText, is.prepared.gameX + (is.prepared.gameWidth - calcTextWidth(is.ctx, quest.toLearnText)) / 2, state.gui.prepared.progressBarTextsY);
}

const drawStatus = (is: InitSettings, state: FormState, quest: WordWithImage) => {
  drawProgressBar(is, state);
  drawHealths(is, state);
  drawQuest(is, state, quest);
}

const drawStatusSuccess = (is: InitSettings, state: FormState, quest: WordWithImage) => {
  drawProgressBarSuccess(is);
  drawHealths(is, state);
  drawQuest(is, state, quest);
}

const drawStatusFail = (is: InitSettings, state: FormState, quest: WordWithImage) => {
  drawProgressBarFail(is);
  drawHealths(is, state);
  drawQuest(is, state, quest);
}

const drawForm = (is: InitSettings, state: FormState, quest: FormCard, falseAnswers: FormCard[], onClick: (card: FormCard) => void, onFinish: (card: FormCard) => void): ButtonManager => {
  drawBackground(is.ctx);
  drawStatus(is, state, quest.word);
  // imgs
  const cards = [ quest, ...falseAnswers ];
  // sizes
  const tableSize = calculateTable(is, state, cards.map((card) => card.word));
  // shuffle
  const questions = shuffleCards(is, cards, tableSize);
  // form end
  let finishTimeout: number | undefined;
  let clickedCard: FormCard | undefined;
  // draw buttons
  const buttons = questions.map((q) => {
    const x = () => is.prepared.gameX + tableSize.start.x + (q.column - 1) * (state.gui.prepared.card.width + formGame.margin);
    const y = () => tableSize.start.y + (q.row - 1) * (state.gui.prepared.card.height + formGame.margin);
    const bgColor = () => {
      if (clickedCard == q.card) {
        if (clickedCard == quest) return settings.colors.success;
        else return settings.colors.fail;
      }
    } 
    const button = drawIconButton(
      is,
      () => {
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
          button.move();
          button.redraw();
        }
      },
      x, y, q.card.word.toLearnImg, () => ({ ...state.gui.prepared.card, bgColor: bgColor() })
    );
    return button;
  });

  const stop = (shouldRedraw: boolean) => buttons.forEach((btn) => btn.stop(shouldRedraw));
  const redraw = () => {
    drawBackground(is.ctx);
    if (clickedCard && clickedCard == quest) {
      drawStatusSuccess(is, state, quest.word);
    } else if (clickedCard && clickedCard != quest) {
      drawStatusFail(is, state, quest.word);
    } else {
      drawStatus(is, state, quest.word);
    }
    buttons.forEach((btn) => btn.redraw());
  }
  const move = () => buttons.forEach((btn) => btn.move());

  return { stop, redraw, move };
}

export default drawForm;
