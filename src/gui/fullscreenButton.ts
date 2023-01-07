import { Init } from "../init";
import settings from "../settings";
import { Button } from "./button";

class FullscreenButton extends Button {
  private readonly ownerRedraw: () => void;
  private moreHover: ReturnType<Init["addHoverRequest"]>;
  private moreClick: ReturnType<Init["addClickRequest"]>;

  private setInvisible(state: boolean) {
    if (!state && this.invisible) {
      this.invisible = false;
      this.redraw();
    } else if (state && !this.invisible) {
      this.invisible = true;
      this.ownerRedraw();
    }
  };

  constructor(init: Init, ownerRedraw: () => void) {
    const x = () => init.ctx.canvas.width - init.prepared.imgs.fullscreen.width / 2 - settings.gui.button.padding - 15;
    const y = () => init.ctx.canvas.height - init.prepared.imgs.fullscreen.height / 2 - settings.gui.button.padding - 15;
    super(init, init.prepared.imgs.fullscreen, x, y, {
      onClick: () => {
        init.ctx.canvas.requestFullscreen();
        this.invisible = true;
      },
      invisible: true,
    }, true);
    this.moreHover = init.addHoverRequest({ 
      isInArea: (xIn, yIn) => xIn >= x() - 70 && yIn >= y() - 70,
      onHover: () => { if (!document.fullscreenElement) this.setInvisible(false); },
      onLeave: () => this.setInvisible(true),
    });
    this.moreClick = init.addClickRequest({
      isInArea: () => true,
      zIndex: -Infinity,
      onReleased: (isInside) => { 
        if (isInside && !document.fullscreenElement && init.prepared.isMobile) {
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
}

export default FullscreenButton;
