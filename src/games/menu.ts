import { AbstractGame, EndGameStats } from ".";
import { Init } from "../init";
import AbstractButton from "../gui/abstractButton";
import { suggestGame } from "../learner";
import { ButtonWithDescription } from "../gui/buttonWithDescription";
import { drawBackground } from "../gui/background";
import { Button } from "../gui/button";
import { ru } from "../translation";
import settings from "../settings";

interface MenuEnd extends EndGameStats { isInfinity?: boolean, isViewer?: boolean };

class Menu extends AbstractGame<ReturnType<typeof suggestGame>, ReturnType<typeof Menu.prepare>, ReturnType<typeof Menu.preparePos>, MenuEnd> {
  private _buttons: AbstractButton<any, any, any, any>[] = [];
  
  private static prepare(init: Init, game: ReturnType<typeof suggestGame>) {
    const descSize = ButtonWithDescription.calcContentSize(init.ctx, game.name, game.label);
    const gameBtnHeight = AbstractButton.calcHeight(descSize.height);
    const gameBtnWidth = AbstractButton.calcWidth(descSize.width);

    // words button
    const wordsSize = Button.calcContentSize(init.ctx, ru.Words);
    const wordsHeight = AbstractButton.calcHeight(wordsSize.height);
    const wordsWidth = AbstractButton.calcWidth(wordsSize.width);
    const wordsMinWidth = () => init.prepared.isMobile ? gameBtnWidth : wordsWidth;

    const wordsBetaX = () =>  init.prepared.isMobile ? 0 : -(gameBtnWidth / 2 + settings.gui.button.distance + wordsWidth / 2);
    const wordsBetaY = () =>  init.prepared.isMobile ? -(gameBtnHeight / 2 + settings.gui.button.distance + height / 2) : 0;

    // infinity play button
    const infSize = Button.calcContentSize(init.ctx, "∞");
    const infHeight = AbstractButton.calcHeight(infSize.height);
    const infWidth = AbstractButton.calcWidth(infSize.width);
    const infMinWidth = () => init.prepared.isMobile ? gameBtnWidth : infWidth;

    const infBetaX = () =>  init.prepared.isMobile ? 0 : gameBtnWidth / 2 + settings.gui.button.distance + infWidth / 2;
    const infBetaY = () =>  init.prepared.isMobile ? gameBtnHeight / 2 + settings.gui.button.distance + height / 2 : 0;

    const height = Math.max(gameBtnHeight, wordsHeight, infHeight);

    return { height, wordsBetaX, wordsBetaY, wordsMinWidth, infBetaX, infBetaY, infMinWidth };
  }
  protected prepare() {
    return Menu.prepare(this.init, this.content);
  }

  private static preparePos(init: Init, prepared: any) {
    const gameX = init.ctx.canvas.width / 2;
    const gameY = init.ctx.canvas.height / 2;

    const wordsX = gameX + prepared.wordsBetaX();
    const wordsY = gameY + prepared.wordsBetaY();

    const infX = gameX + prepared.infBetaX();
    const infY = gameY + prepared.infBetaY();

    return { gameX, gameY, wordsX, wordsY, infX, infY };
  }
  protected preparePos() {
    return Menu.preparePos(this.init, this.prepared);
  }
  protected redraw() {
    drawBackground(this.init.ctx);
    for (const btn of this._buttons) btn.redraw();
  }
  protected scrollOptions() {
    return {
      oneStep: 0,
      maxHeight: 0,
    }
  }
  protected update() {
    for (const btn of this._buttons) btn.dynamic();
  }
  protected start() {
    this._buttons.push(
      new ButtonWithDescription(
        this.init, 
        { text: this.content.name, description: this.content.label }, 
        () => this.preparedPos.gameX,
        () => this.preparedPos.gameY,
        { onClick: () => this.stop({ isSuccess: true }), minHeight: this.prepared.height }
      )
    );
    this._buttons.push(
      new Button(
        this.init, 
        ru.Words, 
        () => this.preparedPos.wordsX,
        () => this.preparedPos.wordsY,
        { 
          onClick: () => this.stop({ isSuccess: true, isViewer: true }), 
          minHeight: this.prepared.height, 
          minWidth: this.prepared.wordsMinWidth 
        }
      )
    );
    this._buttons.push(
      new Button(
        this.init,
        "∞",
        () => this.preparedPos.infX,
        () => this.preparedPos.infY,
        { 
          onClick: () => this.stop({ isSuccess: true, isInfinity: true }), 
          minHeight: this.prepared.height, 
          minWidth: this.prepared.infMinWidth 
        }
      )
    )
  }
  protected freeResources() {
    for (const btn of this._buttons) btn.stop();
  }
}

export default Menu;
