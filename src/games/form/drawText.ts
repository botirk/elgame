import { InitSettings } from "../..";
import { LoadedImg } from "../../compileTime/generated";
import drawBackground from "../../gui/background";
import drawButton, { drawIconButton } from "../../gui/button";
import { calcTextWidth } from "../../gui/text";
import settings, { formGame } from "../../settings";
import { FormState } from "./game";

interface FormImg extends LoadedImg {
  row: number, column: number,
}

const prepare = (is: InitSettings) => {
  return {
    progressBarTextsY: (formGame.progressBarY / 2 + settings.fonts.fontSize / 2),
  }
}
export type Prepared = ReturnType<typeof prepare>;

const calculateCardSize = (is: InitSettings, imgs: LoadedImg[]) => {
  let height = 0;
  let width = 0;
  imgs.forEach((img) => {
    height = Math.max(height, img.img.height + settings.gui.button.padding * 2);
    width = Math.max(width, img.img.width + settings.gui.button.padding * 2);
  });
  return { height, width };
}

const calculateTable = (is: InitSettings, imgs: LoadedImg[], cardSize: ReturnType<typeof calculateCardSize>) => {
  const gameWidth = is.prepared.gameWidth - formGame.margin * 2;
  let columns = Math.max(1, Math.floor(gameWidth / (cardSize.width + formGame.margin)));
  const rows = Math.max(1, Math.ceil(imgs.length / columns));
  const lastRowColumns = imgs.length - (columns * (rows - 1));
  if (rows == 1) columns = lastRowColumns;
  // x 
  const totalWidth = columns * (cardSize.width + formGame.margin) - formGame.margin;
  const widthRemaining = Math.max(0, is.prepared.gameWidth - totalWidth);
  const x = formGame.margin + cardSize.width / 2 + widthRemaining / 2;
  // y
  const totalHeight = rows * (cardSize.height + formGame.margin) - formGame.margin;
  const heightRemaining = Math.max(0, is.ctx.canvas.height - formGame.progressBarY - totalHeight);
  const y = formGame.progressBarY + cardSize.height / 2 + heightRemaining / 2;

  return { columns, rows, lastRowColumns, start: { x, y } };
}

const shuffleCards = (is: InitSettings, questions: LoadedImg[], tableSize: ReturnType<typeof calculateTable>): FormImg[] => {
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
      ...card,
      ...cell,
    };
  });
}

const drawHealth = (is: InitSettings, x: number, y: number) => {
  is.ctx.drawImage(is.prepared.imgs.heart.img, x, y, is.prepared.imgs.heart.img.width, is.prepared.imgs.heart.img.height);
}

const drawHealths = (is: InitSettings, state: FormState) => {
  const y = (formGame.progressBarY - is.prepared.imgs.heart.img.height) / 2;
  const startX = is.prepared.gameXMax - is.prepared.imgs.heart.img.width - formGame.margin;
  for (let i = state.gameplay.score.health; i > 0; i--) {
    drawHealth(is, startX - (state.gameplay.score.health - i) * (is.prepared.imgs.heart.img.width + 5), y);
  }
}

/*const drawProgressBar = (is: InitSettings, state: FormState) => {
  // state
  const time = (state.gameplay.score.wonTime || state.gameplay.score.loseTime) ? (dropGame.difficulties.movie.targets.cd * 0.3) : state.gameplay.targets.cd * 0.3;
  let isSuccess = ((state.gameplay.score?.lastScoreIncreasedTime || -10000) + time > state.lastTick);
  let isFail = ((state.gameplay.score?.lastHealthLostTime || -10000) + time  > state.lastTick);
  if (isSuccess && isFail) {
    isSuccess = (state.gameplay.score.lastScoreIncreasedTime || 0) > (state.gameplay.score?.lastHealthLostTime || 0);
    isFail = !isSuccess;
  }
  // bg
  if (isSuccess) is.ctx.fillStyle = settings.colors.success;
  else if (isFail) is.ctx.fillStyle = settings.colors.fail;
  else is.ctx.fillStyle = settings.colors.questColorBG;
  is.ctx.fillRect(is.prepared.gameX, 0, is.prepared.gameWidth, dropGame.progressBarY);
  // bar
  if (!isSuccess && !isFail) {
    const progress = state.gameplay.score.total / state.gameplay.score.required;
    if (progress < 0.25) is.ctx.fillStyle = settings.colors.questColor1;
    else if (progress < 0.5) is.ctx.fillStyle = settings.colors.questColor2;
    else if (progress < 0.75) is.ctx.fillStyle = settings.colors.questColor3;
    else is.ctx.fillStyle = settings.colors.questColor4;
    is.ctx.fillRect(is.prepared.gameX, 0, is.prepared.gameWidth * progress, dropGame.progressBarY);
  }
}*/

const drawQuest = (is: InitSettings, quest: LoadedImg) => {
  is.ctx.fillStyle = "black";
  is.ctx.font = settings.fonts.ctxFont;
  is.ctx.fillText(quest.name, is.prepared.gameX + (is.prepared.gameWidth - calcTextWidth(is.ctx, quest.name)) / 2, 30);
}

const drawStatus = (is: InitSettings, state: FormState, quest: LoadedImg) => {
  drawHealths(is, state);
  drawQuest(is, quest);
}

const drawForm = (is: InitSettings, state: FormState, quest: LoadedImg, falseAnswers: LoadedImg[], onClick: (text: string) => void) => {
  drawBackground(is.ctx);
  drawStatus(is, state, quest);
  // imgs
  const imgs = [ quest, ...falseAnswers ];
  // sizes
  const cardSize = calculateCardSize(is, imgs);
  const tableSize = calculateTable(is, imgs, cardSize);
  // shuffle
  const questions = shuffleCards(is, imgs, tableSize);
  console.log(tableSize);
  // draw buttons
  const buttons = questions.map((q) => {
    const x = () => is.prepared.gameX + tableSize.start.x + (q.column - 1) * (cardSize.width + formGame.margin);
    const y = () => tableSize.start.y + (q.row - 1) * (cardSize.height + formGame.margin);
    return drawIconButton(
      is, () => onClick(q.name), x, y, q.img, () => cardSize
    );
  });

  const stop = (shouldRedraw: boolean) => buttons.forEach((btn) => btn[0](shouldRedraw));
  const redraw = () => {
    drawBackground(is.ctx);
    drawStatus(is, state, quest);
    buttons.forEach((btn) => btn[1]());
  }
  const move = () => buttons.forEach((btn) => btn[2]());

  return [stop, redraw, move];
}

export default drawForm;
