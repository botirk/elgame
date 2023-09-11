import settings from "../settings";
import CTX from "./CTX";
import { Button } from "./button";
import { ButtonGroupGrid, ButtonGroupTable } from "./buttonGroup";
import { ClickManager } from "./events/click";
import { HoverManager } from "./events/hover";
import { ResizeManager } from "./events/resize";

export default class BottomMenu extends ButtonGroupTable {
  constructor(ctx: CTX) {
    super(ctx);

    const fsButton = new Button(ctx);
    fsButton.onClick = () => {
      this.setInvisible(true);
      ctx.ctx.canvas.requestFullscreen();
    }
    fsButton.invisible = true;
    fsButton.content = ctx.assets.fullscreen;

    const musicButton = new Button(ctx);
    musicButton.onClick = () => {
      if (musicButton.content === this.ctx.assets["volume-mute"]) {
        if (this.ctx.assets.theme.paused) this.ctx.assets.theme.play();
        this.ctx.assets.theme.muted = false;
        musicButton.content = this.ctx.assets.volume;
      } else {
        this.ctx.assets.theme.muted = true;
        musicButton.content = this.ctx.assets["volume-mute"];
      }
      musicButton.redraw();
    }
    musicButton.invisible = true;
    musicButton.content = this.ctx.assets["volume-mute"];
    
    this.content = [[ musicButton, fsButton ]];
    const dynamic = () => this.xy(ctx.ctx.canvas.width - this.width / 2 - settings.gui.button.padding - 15, ctx.ctx.canvas.height - this.height / 2 - settings.gui.button.padding - 15);
    dynamic();
    this.resizeManager = this.ctx.resizeEvent.then({ update: dynamic });
  }

  private resizeManager: ResizeManager;
  private moreHover: HoverManager = this.ctx.hoverEvent.then({
    isInArea: (xIn, yIn) => yIn >= this.ctx.ctx.canvas.height - this.height - settings.gui.button.padding * 2,
    onHover: () => this.setInvisible(false),
    onLeave: () => this.setInvisible(true),
  })
  private moreClick: ClickManager = this.ctx.clickEvent.then({
    isInArea: () => true,
    zIndex: -Infinity,
    onReleased: (isInside) => { 
      if (isInside && !document.fullscreenElement && this.ctx.isMobile) {
        this.setInvisible(!this.invisible);
      }
    },
  })

  private invisible = true;
  private setInvisible(state: boolean) {
    if (!state && this.invisible === true) {
      if (!document.fullscreenElement) {
        this.invisible = false;
        for (const row of (this.content || [[]])) for (const btn of row) if (btn instanceof Button) btn.invisible = false;
        this.redraw();
      }
    } else if (state && this.invisible === false) {
      this.invisible = true;
      for (const row of (this.content || [[]])) for (const btn of row) if (btn instanceof Button) btn.invisible = true;
      this.ctx.redraw();
    }
  }

  stop(): void {
    this.moreHover.stop();
    this.moreClick.stop();
    this.resizeManager();
    super.stop();
  }
}
