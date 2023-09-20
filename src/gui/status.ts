import settings from "../settings";
import CTX from "../CTX";

export default class Status {
  constructor(private readonly ctx: CTX, private readonly endTime: Date) {
    ctx.status?.stop();
    ctx.status = this;
    this.redrawTimer = setInterval(() => ctx.redraw(), 1000);
  }

  private wordSetup?: {
    word: string,
    wordY: number,
    wordX: number,
  }
  private generateSetup(word: string) {
    return {
      word,
      wordY: (settings.gui.status.height + settings.fonts.fontSize) / 2,
      wordX: (this.ctx.ctx.canvas.width / 2) - this.ctx.calcTextWidth(word) / 2,
    }
  }
  set word(word: string | undefined) {
    if (!word) this.wordSetup = undefined;
    else this.wordSetup = this.generateSetup(word);
  }

  redraw() {
    this.drawProgress();
    if (this.wordSetup) {
      this.ctx.ctx.fillStyle = "black";
      this.ctx.ctx.fillText(this.wordSetup.word, this.wordSetup.wordX, this.wordSetup.wordY);
    }
  }

  stop() {
    clearTimeout(this.effectTimeout);
    clearInterval(this.redrawTimer);
    this.resizeManager();
    this.ctx.status = undefined;
  }

  private _lose = false;
  public set lose(state: boolean) {
    this._lose = state;
    if (state) {
      this._victory = false;
      if (this.effectTimeout) clearTimeout(this.effectTimeout);
      this.effectTimeout = setTimeout(() => { this._lose = false; this.ctx.redraw(); }, settings.gui.status.winLoseTime);
    }
  }

  private _victory = false;
  public set victory(state: boolean) {
    this._victory = state;
    if (state) {
      this._lose = false;
      if (this.effectTimeout) clearTimeout(this.effectTimeout);
      this.effectTimeout = setTimeout(() => { this._victory = false; this.ctx.redraw(); }, settings.gui.status.winLoseTime);
    }
  }

  private drawProgress(now = new Date()) {
    if (this._lose === true) {
      this.ctx.ctx.fillStyle = settings.colors.fail;
      this.ctx.ctx.fillRect(0, 0, this.ctx.ctx.canvas.width, settings.gui.status.height);
    } else if (this._victory === true) {
      this.ctx.ctx.fillStyle = settings.colors.success;
      this.ctx.ctx.fillRect(0, 0, this.ctx.ctx.canvas.width, settings.gui.status.height);
    } else {
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
  }

  private drawBar() {
    // bar
    this.ctx.ctx.fillStyle = settings.colors.questColorBG;
    this.ctx.ctx.fillRect(0, 0, this.ctx.ctx.canvas.width, settings.gui.status.height);
  }

  private redrawTimer: NodeJS.Timer;
  private start = new Date();
  private dif = this.endTime.getTime() - this.start.getTime();
  private resizeManager = this.ctx.resizeEvent.then({ update: () => { if (this.wordSetup) this.wordSetup = this.generateSetup(this.wordSetup.word); }});
  private effectTimeout?: NodeJS.Timeout;
}
