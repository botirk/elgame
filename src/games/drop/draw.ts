import { drawQuestAtCenter } from "../../gui/text";
import { InitSettings } from "../../settings";
import { DropState } from "./game";

const drawGameBackground = (is: InitSettings, state: DropState) => {
  is.ctx.fillStyle = is.colors.skyColor;
  is.ctx.fillRect(is.calculated.gameX, 0, is.calculated.gameWidth, is.dimensions.heigth);
}

const drawQuest = (is: InitSettings, state: DropState) => {
  is.ctx.fillStyle = is.colors.questColor;
  drawQuestAtCenter(is, is.calculated.gameX + is.calculated.gameWidth / 2, is.dropGame.questY, state.quest.name + ` ${state.currentSuccessCount}/${state.requiredSuccessCount}`);
}

const drawTargets = (is: InitSettings, state: DropState) => {
  state.targets.forEach((target) => {
    is.ctx.drawImage(target target.x, target.y, state.targetWidth, state.targetWidth)
  });
}

const drawHero = (is: InitSettings, state: DropState) => {
  is.ctx.fillStyle = "#03fc28";
  is.ctx.fillRect(state.heroX, state.heroY, is.hero.width, is.hero.height);
}

const drawFrame = (is: InitSettings, state: DropState) => {
  drawGameBackground(is, state);
  drawHero(is, state);
  drawQuest(is, state);
  drawTargets(is, state);
}

export default drawFrame;
