import settings from "../settings";
import CTX from "./CTX";

export default class Status {
  constructor(private readonly ctx: CTX, private readonly endTime: Date) {
    ctx.status?.stop();
    ctx.status = this;
    this.redrawTimer = setInterval(() => ctx.redraw(), 1000);
  }

  redraw() {
    this.drawProgress();
  }

  stop() {
    clearInterval(this.redrawTimer);
  }

  private drawProgress(now = new Date()) {
    // bg
    this.drawBar();
    // progress
    const progress = Math.max(0, Math.min(1, (now.getTime() - this.start.getTime()) / this.dif));
    if (progress < 0.25) this.ctx.ctx.fillStyle = settings.colors.questColor1;
    else if (progress < 0.5) this.ctx.ctx.fillStyle = settings.colors.questColor2;
    else if (progress < 0.75) this.ctx.ctx.fillStyle = settings.colors.questColor3;
    else this.ctx.ctx.fillStyle = settings.colors.questColor4;
    this.ctx.ctx.fillRect(0, 0, this.ctx.ctx.canvas.width * progress, settings.gui.status.height);
  }

  private drawBar() {
    // bar
    this.ctx.ctx.fillStyle = settings.colors.questColorBG;
    this.ctx.ctx.fillRect(0, 0, this.ctx.ctx.canvas.width, settings.gui.status.height);
  }

  private redrawTimer: NodeJS.Timer;
  private start = new Date();
  private dif = this.endTime.getTime() - this.start.getTime();
}
