import { AbstractGame, EndGameStats } from ".";
import { Init } from "../init";
import AbstractButton from "../gui/abstractButton";
import { suggestGame } from "../learner";
import { ButtonWithDescription } from "../gui/buttonWithDescription";
import { drawBackground } from "../gui/background";
import { Button } from "../gui/button";
import { ru } from "../translation";
import settings from "../settings";
import { ButtonGroupTable } from "../gui/buttonGroup";

interface MenuEnd extends EndGameStats { isInfinity?: boolean, isViewer?: boolean, isAllViewer?: boolean };

class Menu extends AbstractGame<ReturnType<typeof suggestGame>, {}, {}, MenuEnd> {
  private table: ButtonGroupTable;
  
  protected prepare() { return {}; }
  protected preparePos() { return {}; }
  protected redraw() {
    drawBackground(this.init.ctx);
    this.table.redraw();
  }
  protected scrollOptions() {
    return {
      oneStep: this.table.itemHeight,
      maxHeight: this.table.height,
    };
  }
  protected update() {
    this.table.dynamic();
  }
  protected start() {
    const game = new ButtonWithDescription(
      this.init, 
      { text: this.content.name, description: this.content.label }, 
      0, 0,
      { onClick: () => this.stop({ isSuccess: true }) }
    );

    const words = new Button(
      this.init, 
      ru.Words, 
      0, 0,
      { onClick: () => this.stop({ isSuccess: true, isViewer: true }) }
    );
    
    const inf = new Button(
      this.init,
      "∞",
      0, 0,
      { onClick: () => this.stop({ isSuccess: true, isInfinity: true }) }
    );

    const allWords = new Button(
      this.init,
      ru.AllWords,
      0,
      0,
      { onClick: () => this.stop({ isSuccess: true, isAllViewer: true }) }
    );

    this.table = new ButtonGroupTable(
      this.init, 
      [
        [undefined, allWords, undefined],
        [ words, game, inf ],
      ], 
      () => this.init.ctx.canvas.width / 2, () => this.init.ctx.canvas.height / 2
    );
  }
  protected freeResources() {
    this.table.stop();
  }
  protected resize() {
    this.table.resize();
  }
}

export default Menu;
