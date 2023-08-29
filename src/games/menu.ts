import { AbstractGame, EndGameStats } from ".";
import { ButtonGroupTable } from "../gui/buttonGroup";

interface MenuEnd extends EndGameStats { isInfinity?: boolean, isViewer?: boolean, isAllViewer?: boolean };

class Menu extends AbstractGame<{}, {}, {}, MenuEnd> {
  private table: ButtonGroupTable;
  
  protected prepare() { return {}; }
  protected preparePos() { return {}; }
  protected redraw() {
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
  protected start() {
    
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
