import settings from "../settings";
import { randomInArray } from "../utils";
import { AbstractGame, WordWithImage } from ".";
import { EndGameStats } from ".";
import { randomNInArray } from "../utils";
import { ResizeManager } from "../gui/events/resize";

interface DropContent { words: WordWithImage[], setup: ReturnType<typeof Drop.generateSetup> };

class Drop extends AbstractGame<DropContent, EndGameStats> {
  static generateSetup(difficulty: number) {
    difficulty = Math.max(0, Math.min(settings.maxBonusDif, difficulty));
    return {
      targets: {
        speed: (0.5 + difficulty * 0.0125),
        cd: 1500 - difficulty * 45,
      },
      successCountPerWord: difficulty === 0 ? 2 : difficulty === settings.maxBonusDif ? 4 : 3,
      maxHealth: difficulty === settings.maxBonusDif ? 2 : 3,
      maxWordsTillQuest: difficulty === settings.maxBonusDif ? 5 : 4,
    };
  }
  protected init(): void {
    this.dynamic();
    this._quest = this.generateQuest();
    if (this.ctx.status) this.ctx.status.word = this._quest.toLearnText;
    this.ctx.redraw();
    this._frameRequest = requestAnimationFrame(() => this.onTick());
    this.resizeManager = this.ctx.resizeEvent.then({ update: () => this.dynamic() });
  }
  private generateQuest() {
    let wordsAvailable = this.content.words;
    if (this._quest) {
      const remaining = wordsAvailable.filter((word) => this._score.perWord[word.toLearnText] < this._score.requiredPerWord);
      if (remaining.length == 1) {
        wordsAvailable = remaining;
      } else if (remaining.length > 0) {
        wordsAvailable = remaining.filter((word) => word != this._quest);
      }
    }
    return randomInArray(wordsAvailable);
  }
  private generateTarget() {
    if (this._targets.candidates.length === 0 || !this._targets.candidates.includes(this._quest)) {
      this._targets.candidates = randomNInArray(this.ctx.wordsWithImage(), this.content.setup.maxWordsTillQuest + 1);
      if (!this._targets.candidates.includes(this._quest)) {
        this._targets.candidates[Math.floor(Math.random() * this._targets.candidates.length)] = this._quest;
      }
    }
    const word = this._targets.candidates.pop() as WordWithImage;
    const x = this._dynamic.clickableGameX + Math.random() * this._dynamic.clickableGameWidth, y = settings.dimensions.heigth + settings.gui.icon.height * 1.5;
    return { word, x, y, timeGenerated: this._frameRequest };
  }
  private gameplay() {
    this._targets.a.forEach((target, i) => {
      const isMiss = (target.y < settings.gui.status.height - target.word.toLearnImg.height);
      const isHit = (Math.abs(this._hero.x - target.x) <= settings.gui.icon.width) && (Math.abs(this._hero.y - target.y) <= settings.gui.icon.height);
      const isQuest = (target.word === this._quest);
      if (isHit && isQuest) {
        if (this._score.perWord[this._quest.toLearnText] < this._score.requiredPerWord) {
          this._score.perWord[this._quest.toLearnText] += 1;
          this._score.total += 1;
          this.ctx.progress.saveProgressSuccess(target.word.toLearnText, this._targets.partners.map((word) => word.toLearnText));
          if (this.ctx.status) this.ctx.status.victory = true;
          this._targets.partners = [];
        }
        if (this._score.total == this._score.required) {
          cancelAnimationFrame(this._frameRequest);
          this._stopTimeout = setTimeout(() => { this.ctx.progress.saveProgressEnd("drop"); this.stop(); }, settings.gui.status.winLoseTime);
        } else {
          this._quest = this.generateQuest();
          if (this.ctx.status) this.ctx.status.word = this._quest.toLearnText;
        }
      } else if (isHit && !isQuest) {
        this.ctx.progress.saveProgressFail(this._quest.toLearnText, target.word.toLearnText);
        if (this.ctx.status) this.ctx.status.lose = true;
        this._targets.partners = [];
      } else if (isMiss && isQuest) {
        this.ctx.progress.saveProgressFailSolo(this._quest.toLearnText);
        if (this.ctx.status) this.ctx.status.lose = true;
        this._targets.partners = [];
      }
      if (isHit || isMiss) {
        const word = this._targets.a.splice(i, 1)[0].word;
        if (isMiss && !isQuest) this._targets.partners.push(word);
      } 
    });
    // generate new
    if (this._targets.nextGeneration <= 0) {
      this._targets.a.push(this.generateTarget());
      this._targets.nextGeneration = this._targets.cd;
    }
  }
  private motion(dif: number) {
    let ldif = dif;
    if (this._mouse.accelerationKB || this._mouse.acceleration) ldif *= settings.drop.acceleration;
    
    if (this._mouse.x) {
      if (this._hero.x > this._mouse.x - settings.gui.icon.width / 2)
        this._hero.x = Math.max(this._hero.x - this._hero.speed * ldif, this._mouse.x - settings.gui.icon.width / 2); 
      else 
        this._hero.x = Math.min(this._hero.x + this._hero.speed * ldif, this._mouse.x - settings.gui.icon.width / 2);
      // fix
      this._hero.x = Math.max(this.ctx.gameX, Math.min(this._dynamic.clickableGameXMax, this._hero.x));
    }
    let speed = this._targets.speed * ldif;
    this._targets.a.forEach((target) => target.y -= speed);
    this._targets.nextGeneration -= ldif;
  }
  private drawGameBackground() {
    this.ctx.ctx.fillStyle = settings.colors.sky;
    this.ctx.ctx.fillRect(this.ctx.gameX, settings.gui.status.height, this.ctx.gameWidth, settings.dimensions.heigth);
  }
  private drawTargets() {
    for (const target of this._targets.a) {
      this.ctx.ctx.drawImage(target.word.toLearnImg, target.x,target.y, target.word.toLearnImg.width, target.word.toLearnImg.height);
    }
  }
  private drawHero() {
    this.ctx.ctx.drawImage(this.ctx.assets.cat, this._hero.x, this._hero.y, this.ctx.assets.cat.width, this.ctx.assets.cat.height);
  }
  private onTick() {
    this._frameRequest = requestAnimationFrame(() => this.onTick());
    const newTime = performance.now();
    const dif = newTime - this._lastFrameTime;
    this._lastFrameTime = newTime;
    this.motion(dif);
    this.gameplay();
    this.ctx.redraw();
  }
  protected freeResources(): void {
    clearTimeout(this._stopTimeout);
    cancelAnimationFrame(this._frameRequest);
    this.stopMouse();
    this.stopLeft();
    this.stopRight();
    this.stopSpace();
    this.resizeManager();
    if (this.ctx.status) this.ctx.status.word = undefined;
  }
  private dynamic() {
    this._dynamic.maxXHero = this.ctx.gameXMax - settings.gui.icon.width;
    this._dynamic.maxXTarget = this.ctx.gameXMax - settings.gui.icon.width;
    this._dynamic.clickableGameX = (this.ctx.ctx.canvas.width - this.ctx.gameWidth) / 2 + settings.gui.icon.width;
    this._dynamic.clickableGameXMax = (this.ctx.ctx.canvas.width + this.ctx.gameWidth) / 2 - settings.gui.icon.width;
    this._dynamic.clickableGameWidth = this.ctx.gameWidth - settings.gui.icon.width * 2;
    this._hero.x = Math.max(this._dynamic.clickableGameX, Math.min(this._dynamic.clickableGameXMax, this._hero.x));
    for (const target of this._targets.a) {
      target.x = Math.max(this._dynamic.clickableGameX, Math.min(this._dynamic.clickableGameXMax, this._hero.x));
    }
  }
  protected innerRedraw() {
    this.ctx.drawBackground();
    this.drawGameBackground();
    this.drawHero();
    this.drawTargets();
  }

  private stopMouse = this.ctx.moveEvent.then((x, y) => {
    this._mouse.x = x, this._mouse.y = y;
    this._mouse.acceleration = (y <= settings.gui.status.height);
  });
  private stopSpace = this.ctx.buttonEvent.then({
    button: " ",
    onReleased: () => this._mouse.accelerationKB = false,
    onPressed: () => this._mouse.accelerationKB = true,
  });
  private stopRight = this.ctx.buttonEvent.then({
    button: "ArrowRight",
    onPressed: () => { this._mouse.x = Infinity; },
    onReleased: () => { this._mouse.x = undefined; },
  });
  private stopLeft = this.ctx.buttonEvent.then({
    button: "ArrowLeft",
    onPressed: () => { this._mouse.x = -Infinity; },
    onReleased: () => { this._mouse.x = undefined; },
  });
  private resizeManager: ResizeManager;
  private _stopTimeout?: NodeJS.Timeout;
  private _frameRequest: number;
  private _lastFrameTime: number = performance.now();
  private _mouse = { 
    x: undefined as number | undefined, 
    y: undefined as number | undefined,
    acceleration: false, 
    accelerationKB: false,
  }
  private _dynamic = {
    maxXHero: 0,
    maxXTarget: 0,
    clickableGameX: 0,
    clickableGameXMax: 0,
    clickableGameWidth: 0,
  };
  private _quest: WordWithImage;
  private _hero = {
    x: this.ctx.gameX + this.ctx.gameWidth / 2, 
    y: settings.drop.heroY,
    speed: settings.drop.mouseSpeed * this.ctx.verticalSpeedMultiplier 
  }
  private _targets = {
    a: [] as { word: WordWithImage, x: number, y: number, timeGenerated: number }[],
    partners: [] as WordWithImage[],
    candidates: [] as WordWithImage[],
    nextGeneration: 0,
    speed: this.content.setup.targets.speed,
    cd: this.content.setup.targets.cd,
  }
  private _score = {
    required: this.content.setup.successCountPerWord * this.content.words.length, total: 0,
    requiredPerWord: this.content.setup.successCountPerWord,
    perWord: this.content.words.reduce((prev, word) => { prev[word.toLearnText] = 0; return prev; }, {}),
  }
}

export default Drop;
