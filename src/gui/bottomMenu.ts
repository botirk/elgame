import settings from "../settings";
import CTX from "./CTX";
import { Button } from "./button";
import { ButtonGroupGrid, ButtonGroupTable } from "./buttonGroup";
import { ClickManager } from "./events/click";
import { HoverManager } from "./events/hover";

export default class BottomMenu extends ButtonGroupTable {
  constructor(ctx: CTX) {
    const fsButton = new Button(ctx, ctx.assets.fullscreen, {
      onClick: () => {
        this.setInvisible(true);
        ctx.ctx.canvas.requestFullscreen();
      },
      invisible: true,
    });
    super(ctx, [[fsButton]]);
    const x = () => ctx.ctx.canvas.width - this.width / 2 - settings.gui.button.padding - 15;
    const y = () => ctx.ctx.canvas.height - this.height / 2 - settings.gui.button.padding - 15;
    this.xy(x, y);
    this.moreHover = ctx.hoverEvent.then({
      isInArea: (xIn, yIn) => yIn >= ctx.ctx.canvas.height - this.height - settings.gui.button.padding * 2,
      onHover: () => this.setInvisible(false),
      onLeave: () => this.setInvisible(true),
    });
    this.moreClick = ctx.clickEvent.then({
      isInArea: () => true,
      zIndex: -Infinity,
      onReleased: (isInside) => { 
        if (isInside && !document.fullscreenElement && ctx.isMobile) {
          this.setInvisible(!this.invisible);
        }
      },
    });
  }

  protected _content: (Button | undefined)[][];

  private moreHover: HoverManager;
  private moreClick: ClickManager;

  private invisible = true;
  private setInvisible(state: boolean) {
    if (!state && this.invisible === true) {
      if (!document.fullscreenElement) {
        this.invisible = false;
        for (const row of this._content) for (const btn of row) if (btn) btn.invisible = false;
        this.redraw();
      }
    } else if (state && this.invisible === false) {
      this.invisible = true;
      for (const row of this._content) for (const btn of row) if (btn) btn.invisible = true;
      this.ctx.redraw();
    }
  }

  stop(): void {
    this.moreHover.stop();
    this.moreClick.stop();
    super.stop();
  }
}
