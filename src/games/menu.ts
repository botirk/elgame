import { AbstractGame, EndGameStats } from ".";
import { Init } from "../init";
import AbstractButton from "../gui/abstractButton";
import { suggestGame } from "../learner";
import { ButtonWithDescription } from "../gui/buttonWithDescription";
import { drawBackground } from "../gui/background";
import { Button } from "../gui/button";
import { ru } from "../translation";
import settings from "../settings";

interface MenuEnd extends EndGameStats { isInfinity?: boolean, isViewer?: boolean, isAllViewer?: boolean };

class Menu extends AbstractGame<ReturnType<typeof suggestGame>, ReturnType<typeof Menu.prepare>, ReturnType<typeof Menu.preparePos>, MenuEnd> {
  private _buttons: AbstractButton<any, any, any, any>[] = [];
  
  private static prepare(init: Init, game: ReturnType<typeof suggestGame>) { 
    // all words button
    const allWordSize = Button.calcContentSize(init.ctx, ru.AllWords);
    const allWordsHeight = AbstractButton.calcHeight(allWordSize.height);
    const allWordsWidth = AbstractButton.calcWidth(allWordSize.width);
    const allWordsMinWidth = () => init.prepared.isMobile ? gameBtnWidth : allWordsWidth;

    const allWordsX = () => init.ctx.canvas.width / 2;
    const allWordsY = () => init.prepared.isMobile 
      ? init.ctx.canvas.height / 2 - settings.gui.button.distance * 1.5 - height / 2
      : init.ctx.canvas.height / 2 - settings.gui.button.distance / 2 - height / 2;
    // words button
    const wordsSize = Button.calcContentSize(init.ctx, ru.Words);
    const wordsHeight = AbstractButton.calcHeight(wordsSize.height);
    const wordsWidth = AbstractButton.calcWidth(wordsSize.width);
    const wordsMinWidth = () => init.prepared.isMobile ? gameBtnWidth : wordsWidth;

    const wordsX = () =>  init.prepared.isMobile ? gameX() : gameX() - (gameBtnWidth / 2 + settings.gui.button.distance + wordsWidth / 2);
    const wordsY = () =>  init.prepared.isMobile
      ? allWordsY() + settings.gui.button.distance + height 
      : init.ctx.canvas.height / 2 + settings.gui.button.distance / 2 + height / 2;
    // game button
    const descSize = ButtonWithDescription.calcContentSize(init.ctx, game.name, game.label);
    const gameBtnHeight = AbstractButton.calcHeight(descSize.height);
    const gameBtnWidth = AbstractButton.calcWidth(descSize.width);

    const gameX = () => init.ctx.canvas.width / 2;
    const gameY = () => init.prepared.isMobile 
      ? wordsY() + settings.gui.button.distance + height
      : wordsY();
    // infinity play button
    const infSize = Button.calcContentSize(init.ctx, "∞");
    const infHeight = AbstractButton.calcHeight(infSize.height);
    const infWidth = AbstractButton.calcWidth(infSize.width);
    const infMinWidth = () => init.prepared.isMobile ? gameBtnWidth : infWidth;

    const infX = () =>  init.prepared.isMobile ? gameX() : gameX() + (gameBtnWidth / 2 + settings.gui.button.distance + infWidth / 2);
    const infY = () =>  init.prepared.isMobile 
      ? gameY() + settings.gui.button.distance + height
      : wordsY();

    // total height
    const totalHeight = () => init.prepared.isMobile ? infY() - wordsY() + height : height;

    const height = Math.max(gameBtnHeight, wordsHeight, infHeight, allWordsHeight);

    return { 
      height, 
      gameX, gameY, 
      wordsX, wordsY, wordsMinWidth,
      allWordsX, allWordsY, allWordsMinWidth, 
      infX, infY, infMinWidth, totalHeight 
    };
  }
  protected prepare() {
    return Menu.prepare(this.init, this.content);
  }

  private static preparePos() {
    return { };
  }
  protected preparePos() {
    return Menu.preparePos();
  }
  protected redraw() {
    drawBackground(this.init.ctx);
    for (const btn of this._buttons) btn.redraw();
  }
  protected scrollOptions() {
    return {
      oneStep: this.prepared.height,
      maxHeight: this.prepared.totalHeight(),
    };
  }
  protected update() {
    for (const btn of this._buttons) btn.dynamic();
  }
  protected start() {
    this._buttons.push(
      new ButtonWithDescription(
        this.init, 
        { text: this.content.name, description: this.content.label }, 
        this.prepared.gameX,
        this.prepared.gameY,
        { 
          onClick: () => this.stop({ isSuccess: true }), 
          minHeight: this.prepared.height 
        }
      )
    );
    this._buttons.push(
      new Button(
        this.init, 
        ru.Words, 
        this.prepared.wordsX,
        this.prepared.wordsY,
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
        this.prepared.infX,
        this.prepared.infY,
        { 
          onClick: () => this.stop({ isSuccess: true, isInfinity: true }), 
          minHeight: this.prepared.height, 
          minWidth: this.prepared.infMinWidth 
        }
      )
    )
    this._buttons.push(
      new Button(
        this.init,
        ru.AllWords,
        this.prepared.allWordsX,
        this.prepared.allWordsY,
        { 
          onClick: () => this.stop({ isSuccess: true, isAllViewer: true }), 
          minHeight: this.prepared.height, 
          minWidth: this.prepared.allWordsMinWidth,
        }
      )
    )
  }
  protected freeResources() {
    for (const btn of this._buttons) btn.stop();
  }
}

export default Menu;