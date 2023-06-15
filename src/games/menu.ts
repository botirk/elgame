import { AbstractGame, EndGameStats } from ".";
import { loadProgress, suggestGame, Suggestion } from "../learner";
import { ButtonWithDescription } from "../gui/buttonWithDescription";
import { drawBackground } from "../gui/background";
import { Button } from "../gui/button";
import { ru } from "../translation";
import { ButtonGroupTable, Table } from "../gui/buttonGroup";
import { ButtonLike } from "../gui/abstractButton";

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

    const table: Table = [
      [undefined, allWords, undefined],
      [ words, game, inf ],
    ];

    if (this.content.dif) {
      const difSaved = this.content.dif;
      const plus = new Button(this.init, "+", 0, 0, { 
        onClick: () => {
          difSaved.dif = Math.min(this.content.dif?.end || 0, difSaved.dif + 1);
          difSaved.saveDif(difSaved.dif);

          if (difSaved.dif === difSaved.end) plus.disabled = true;
          if (difSaved.dif !== 0) minus.disabled = false;
          pmButton.redraw();

          const sizeChanged = dif.setContentWithSizeChange(`${ru.Difficulty}: ${difSaved.dif}`);
          if (sizeChanged) {
            this.table.innerResize();
            this.redraw();
          } else {
            dif.redraw();
          }
        },
        disabled: (difSaved.dif === difSaved.end)
      });
      const minus = new Button(this.init, "-", 0, 0, { 
        onClick: () => { 
          difSaved.dif = Math.max(0, difSaved.dif - 1);
          difSaved.saveDif(difSaved.dif);
          
          if (difSaved.dif === 0) minus.disabled = true;
          if (difSaved.dif !== difSaved.end) plus.disabled = false;
          pmButton.redraw();

          dif.content = `${ru.Difficulty}: ${difSaved.dif}`;
          dif.redraw();
        },
        disabled: (difSaved.dif === 0)
      });
      const pmButton = new ButtonGroupTable(this.init, [[plus], [minus]], 0, 0);
    
      const dif = new Button(this.init, `${ru.Difficulty}: ${this.content.dif.dif}`, 0, 0, { likeLabel: true });
      table.push([ undefined, undefined, undefined ]);
      table.push([ undefined, dif, pmButton ]);
    }

    this.table = new ButtonGroupTable(this.init, table, () => this.init.ctx.canvas.width / 2, () => this.init.ctx.canvas.height / 2);
  }
  protected freeResources() {
    this.table.stop();
  }
  protected resize() {
    this.table.dynamic();
    this.table.resize();
  }
}

export default Menu;
