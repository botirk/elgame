import settings from "../settings";
import CTX from "./CTX";
import { Button } from "./button";
import { ClickManager } from "./events/click";
import { HoverManager } from "./events/hover";

class FullscreenButton extends Button {
  private readonly ownerRedraw: () => void;
  private moreHover: HoverManager;
  private moreClick: ClickManager;

  private setInvisible(state: boolean) {
    if (!state && this.invisible) {
      if (!document.fullscreenElement) {
        this.invisible = false;
        this.redraw();
      }
    } else if (state && !this.invisible) {
      this.invisible = true;
      this.ownerRedraw();
    }
  };

  constructor(ctx: CTX, ownerRedraw: () => void) {
    const x = () => ctx.ctx.canvas.width - ctx.assets.fullscreen.width / 2 - settings.gui.button.padding - 15;
    const y = () => ctx.ctx.canvas.height - ctx.assets.fullscreen.height / 2 - settings.gui.button.padding - 15;
    super(ctx, ctx.assets.fullscreen, x, y, {
      onClick: () => {
        ctx.ctx.canvas.requestFullscreen();
        this.invisible = true;
      },
      invisible: true,
    });
    this.ownerRedraw = ownerRedraw;
    this.moreHover = ctx.hoverEvent.then({ 
      isInArea: (xIn, yIn) => xIn >= x() - 70 && yIn >= y() - 70,
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

  stop(shouldRedrawToDefault?: boolean | undefined): void {
    this.moreHover.stop();
    this.moreClick.stop();
    super.stop(shouldRedrawToDefault);
  }

  dynamic(): void {
    super.dynamic();
    this.moreHover.update();
  }
}

export default FullscreenButton;
