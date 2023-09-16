import { AbstractGame, EndGameStats, WordWithImage } from "..";
import settings from "../../settings";
import { FormGameSetup, formSettings as formGame, formSettings } from "./settings";
import { ButtonGroupGrid, ButtonGroupTable } from "../../gui/buttonGroup";
import { randomiseArray } from "../../utils";
import { Button } from "../../gui/button";
import { ResizeManager } from "../../gui/events/resize";

class Form extends AbstractGame<{ answer: WordWithImage, falseAnswers: WordWithImage[], setup: FormGameSetup }, EndGameStats> {
  protected init(): void {
    const buttons = this.answers.map((answer) => {
      const button = new Button(this.ctx);
      button.content = answer.toLearnImg;
      button.onClick = () => {
        if (this.endTimer) {
          return;
        } else if (answer === this.content.answer) {
          button.bgColor = settings.colors.success;
          this.ctx.progress.saveProgressSuccess(this.content.answer.toLearnText, this.content.falseAnswers.map((fa) => fa.toLearnText));
          this.endTimer = setTimeout(() => {
            this.ctx.progress.saveProgressEnd("form");
            this.stop();
          }, formSettings.pause);
          
        } else {
          button.bgColor = settings.colors.fail;
          this.ctx.progress.saveProgressFail(this.content.answer.toLearnText, answer.toLearnText);
        }
        button.onClick = undefined;
      }; 
      return button;
    });
    const grid = new ButtonGroupGrid(this.ctx);
    grid.content = buttons;
    const word = new Button(this.ctx);
    word.likeLabel = true;
    word.content = this.content.answer.toLearnText;
    this.table = new ButtonGroupTable(this.ctx);
    this.table.content = [[ word ], [ grid ]];
    const dynamic = () => {
      this.table.xy(this.ctx.centerX(), this.ctx.centerY());
    }
    dynamic();
    this.resizeManager = this.ctx.resizeEvent.then({ update: dynamic });
  }
 
  protected innerRedraw(): void {
    this.ctx.drawBackground();
    this.table.redraw();
  }

  protected freeResources(): void {
    this.table.stop();
    this.resizeManager();
    if (this.endTimer) clearTimeout(this.endTimer);
  }

  private endTimer?: NodeJS.Timeout;
  private resizeManager: ResizeManager;
  private table: ButtonGroupTable;
  readonly answers: WordWithImage[] = randomiseArray([ this.content.answer, ...this.content.falseAnswers ]);
}

export default Form;
