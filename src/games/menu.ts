import { AbstractGame, EndGameStats, Word } from ".";
import { Button } from "../gui/button";
import { ButtonGroupTable, Table } from "../gui/buttonGroup";
import WordsTable from "../gui/wordsTable";
import settings from "../settings";
import { ru } from "../translation";

interface MenuEnd extends EndGameStats { is5?: boolean, is25?: boolean };

class Menu extends AbstractGame<Word[], any, any, MenuEnd> {
  private table: ButtonGroupTable;
  
  protected prepare() { }
  protected preparePos() { }
  protected start() {
    const menuTable = this.menuTable();
    debugger;
    const wordsTable = new WordsTable(this.ctx, this.content);
    this.table = new ButtonGroupTable(this.ctx, [[menuTable], [wordsTable]], () => this.ctx.centerX(), () => this.ctx.centerY());
    debugger;
    console.log(menuTable.content[2][2]?.endY);
    console.log(menuTable.startY, menuTable.endY)
    console.log(wordsTable.startY, wordsTable.endY)
  }
  protected innerRedraw() {
    this.ctx.drawBackground();
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
  protected freeResources() {
    this.table.stop();
  }
  private menuTable() {
    const result: Table = [];
    result.push([ undefined, new Button(this.ctx, ru["5minuteGame"], { onClick: () => this.stop({ isSuccess: true, is5: true }) }) ]);
    result.push([ undefined, new Button(this.ctx, ru["25minuteGame"], { onClick: () => this.stop({ isSuccess: true, is25: true }) }) ]);
    {
      const plus = new Button(this.ctx, "+", {
        onClick: () => {
          this.ctx.progress.bonusDif = Math.min(settings.maxBonusDif, this.ctx.progress.bonusDif + 1);
          this.ctx.progress.save();

          if (this.ctx.progress.bonusDif === settings.maxBonusDif) plus.disabled = true;
          if (this.ctx.progress.bonusDif !== 0) minus.disabled = false;
          pmButton.redraw();

          const sizeChanged = dif.setContentWithSizeChangeCheck(`${ru.BonusDifficulty}: ${this.ctx.progress.bonusDif}`);
          if (sizeChanged) {
            this.table.innerResize();
            this.ctx.redraw();
          } else {
            dif.redraw();
          }
        },
        disabled: (this.ctx.progress.bonusDif === settings.maxBonusDif)
      });
      const minus = new Button(this.ctx, "-", { 
        onClick: () => { 
          this.ctx.progress.bonusDif = Math.max(0, this.ctx.progress.bonusDif - 1);
          this.ctx.progress.save();
          
          if (this.ctx.progress.bonusDif === 0) minus.disabled = true;
          if (this.ctx.progress.bonusDif !== settings.maxBonusDif) plus.disabled = false;
          pmButton.redraw();

          dif.content = `${ru.BonusDifficulty}: ${this.ctx.progress.bonusDif}`;
          dif.redraw();
        },
        disabled: (this.ctx.progress.bonusDif === 0)
      });
      const pmButton = new ButtonGroupTable(this.ctx, [[plus], [minus]]);
      const dif = new Button(this.ctx, `${ru.BonusDifficulty}: ${this.ctx.progress.bonusDif}`, { likeLabel: true });
      result.push([ undefined, dif, pmButton ]);
    }
    return new ButtonGroupTable(this.ctx, result);
  }
}

export default Menu;
