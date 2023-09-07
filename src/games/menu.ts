import { AbstractGame, EndGameStats, Word } from ".";
import { Button } from "../gui/button";
import { ButtonGroupTable} from "../gui/buttonGroup";
import { ResizeManager } from "../gui/events/resize";
import { ScrollManager } from "../gui/events/scroll";
import wordsTable from "../gui/wordsTable";
import settings from "../settings";
import { ru } from "../translation";

interface MenuEnd extends EndGameStats { is5?: boolean, is25?: boolean };

class Menu extends AbstractGame<Word[], any, any, MenuEnd> {
  private table: ButtonGroupTable;

  private resizeManager: ResizeManager;
  private scrollManager: ScrollManager;
  
  protected prepare() { }
  protected preparePos() { }
  protected start() {
    const menuTable = this.menuTable();
    const words = wordsTable(this.ctx, this.content);
    this.table = new ButtonGroupTable(this.ctx);
    const limitRect = () => ({ startX: 0, startY: this.ctx.ctx.canvas.height / 5 }); 
    this.table.padding *= 5;
    this.table.limitRect = limitRect();
    this.resizeManager = this.ctx.resizeEvent.then(({ update: () => { this.table.limitRect = limitRect() }}));
    this.table.xy(() => this.ctx.centerX(), () => this.ctx.centerY() - this.ctx.scrollEvent.pos);
    this.table.content = [[menuTable], [words]];
    this.scrollManager = this.ctx.scrollEvent.then({ oneStep: 25, maxHeight: () => (this.table.limitRect?.startY || 0) + this.table.height + settings.gui.button.padding, dynamic: () => this.table.dynamic() });
    const dynamic = this.table.dynamic.bind(this.table);
    this.table.dynamic = () => {
      const b = this;
      dynamic();
      debugger;
    }
  }
  protected innerRedraw() {
    this.ctx.drawBackground();
    this.table.redraw();
  }
  protected scrollOptions() {
    return {
      oneStep: 0,
      maxHeight: this.table.height,
    };
  }
  protected update() {
    this.table.dynamic();
  }
  protected freeResources() {
    this.table.stop();
    this.resizeManager();
    this.scrollManager();
  }
  private menuTable() {
    const game5 = new Button(this.ctx);
    game5.onClick = () => this.stop({ isSuccess: true, is5: true });
    game5.content = ru["5minuteGame"];

    const game25 = new Button(this.ctx);
    game25.onClick = () => this.stop({ isSuccess: true, is25: true });
    game25.content = ru["25minuteGame"];

    const dif = new Button(this.ctx);
    dif.likeLabel = true;
    dif.content = `${ru.BonusDifficulty}: ${this.ctx.progress.bonusDif}`;

    const plus = new Button(this.ctx);
    plus.onClick = () => {
      this.ctx.progress.bonusDif = Math.min(settings.maxBonusDif, this.ctx.progress.bonusDif + 1);
      this.ctx.progress.save();

      if (this.ctx.progress.bonusDif === settings.maxBonusDif) plus.disabled = true;
      if (this.ctx.progress.bonusDif !== 0) minus.disabled = false;
      pmButton.redraw();
      
      const sizeChanged = dif.setContentWithSizeChangeCheck(`${ru.BonusDifficulty}: ${this.ctx.progress.bonusDif}`);
      if (sizeChanged) {
        result.innerResize();
        this.ctx.redraw();
      } else {
        dif.redraw();
      }
    }
    plus.disabled = (this.ctx.progress.bonusDif === settings.maxBonusDif);
    plus.content = "+";

    const minus = new Button(this.ctx);
    minus.onClick = () => { 
      this.ctx.progress.bonusDif = Math.max(0, this.ctx.progress.bonusDif - 1);
      this.ctx.progress.save();
      
      if (this.ctx.progress.bonusDif === 0) minus.disabled = true;
      if (this.ctx.progress.bonusDif !== settings.maxBonusDif) plus.disabled = false;
      pmButton.redraw();

      dif.content = `${ru.BonusDifficulty}: ${this.ctx.progress.bonusDif}`;
      dif.redraw();
    };
    minus.disabled = (this.ctx.progress.bonusDif === 0);
    minus.content = "-";

    const pmButton = new ButtonGroupTable(this.ctx);
    pmButton.content = [[plus], [minus]];

    const result = new ButtonGroupTable(this.ctx);
    result.equalizeAllHeight = true;
    result.content = [[ undefined, game5, undefined ], [ undefined, game25, undefined ], [ undefined, dif, pmButton ]];
    
    return result;
  }
}

export default Menu;
