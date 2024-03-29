import { AbstractGame, EndGameStats } from ".";
import { Button } from "../gui/button";
import { ButtonGroupTable} from "../gui/buttonGroup";
import { ResizeManager } from "../gui/events/resize";
import { ScrollManager } from "../gui/events/scroll";
import wordsTable from "../gui/wordsTable";
import settings from "../settings";
import { ru } from "../translation";

interface MenuEnd extends EndGameStats { is5?: boolean, is25?: boolean };

class Menu extends AbstractGame<undefined, MenuEnd> {
  protected init() {
    const menuTable = this.menuTable();
    const { table: words, dynamic: dynamicWords } = wordsTable(this.ctx);
    this.table = new ButtonGroupTable(this.ctx);
    this.table.padding *= 5;
    const dynamic = () => {
      this.table.xy(this.ctx.centerX(), this.ctx.centerY() - this.ctx.scrollEvent.pos);
      this.table.limitRect = { startX: 0, startY: this.ctx.ctx.canvas.height / 5 };
    }
    dynamic();
    this.table.content = [[menuTable], [words]];
    
    this.refreshTimer = setInterval(() => {
      if (dynamicWords()) this.table.innerResize();
      this.ctx.redraw();
    }, 300);
    this.resizeManager = this.ctx.resizeEvent.then(({ update: () => {  dynamic(); this.table.screenResize(); }}));
    this.scrollManager = this.ctx.scrollEvent.then({ oneStep: 25, maxHeight: () => (this.table.limitRect?.startY || 0) + this.table.height + settings.gui.button.padding, dynamic });
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
    this.table.screenResize();
  }
  protected freeResources() {
    this.table.stop();
    this.resizeManager();
    this.scrollManager();
    clearInterval(this.refreshTimer);
  }
  private menuTable() {
    const game5 = new Button(this.ctx);
    game5.onClick = () => this.stop({ is5: true });
    game5.content = ru["5minuteGame"];

    const game25 = new Button(this.ctx);
    game25.onClick = () => this.stop({ is25: true });
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

  private refreshTimer: NodeJS.Timer;
  private table: ButtonGroupTable;
  private resizeManager: ResizeManager;
  private scrollManager: ScrollManager;
}

export default Menu;
