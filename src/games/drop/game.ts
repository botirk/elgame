import settings from "../../settings";
import { dropSettings, DropGameSetup } from "./settings";
import { Init } from "../../init";
import { randomInArray } from "../../utils";
import { AbstractGame, WordWithImage } from "..";
import { EndGameStats } from "..";
import { drawStatusText, prepareStatusText } from "../../gui/status";
import { randomNInArray } from "../../utils";
import { drawBackground } from "../../gui/background";

const preparePos = (init: Init) => ({
  maxXHero: init.prepared.gameXMax - settings.gui.icon.width, 
  maxXTarget: init.prepared.gameXMax - settings.gui.icon.width,
  clickableGameX: (init.ctx.canvas.width - init.prepared.gameWidth) / 2 + settings.gui.icon.width,
  clickableGameXMax: (init.ctx.canvas.width + init.prepared.gameWidth) / 2 - settings.gui.icon.width,
  clickableGameWidth: init.prepared.gameWidth - settings.gui.icon.width * 2,
});

const prepare =  (init: Init) => ({
  ...prepareStatusText(init)
});

interface DropContent { words: WordWithImage[], setup: DropGameSetup };

class Drop extends AbstractGame<DropContent, ReturnType<typeof prepare>, ReturnType<typeof preparePos>, EndGameStats> {
  private stopMouse = this.init.addMoveRequest((x, y) => {
    this._mouse.x = x, this._mouse.y = y;
    this._mouse.acceleration = (y <= settings.gui.status.height);
  });
  private stopSpace = this.init.addButtonRequest({
    button: " ",
    onReleased: () => this._mouse.accelerationKB = false,
    onPressed: () => this._mouse.accelerationKB = true,
  });
  private stopRight = this.init.addButtonRequest({
    button: "ArrowRight",
    onPressed: () => { this._mouse.x = Infinity; },
    onReleased: () => { this._mouse.x = undefined; },
  });
  private stopLeft = this.init.addButtonRequest({
    button: "ArrowLeft",
    onPressed: () => { this._mouse.x = -Infinity; },
    onReleased: () => { this._mouse.x = undefined; },
  });
  private _timer: NodeJS.Timer;
  private _lastTick: number;
  private _mouse = { 
    x: undefined as number | undefined, 
    y: undefined as number | undefined,
    acceleration: false, 
    accelerationKB: false,
  }
  private _quest: WordWithImage;
  private _hero = {
    x: this.init.prepared.gameX + this.init.prepared.gameWidth / 2, 
    y: dropSettings.heroY, 
    speed: dropSettings.mouseSpeed * this.init.prepared.verticalSpeedMultiplier 
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
    health: this.content.setup.maxHealth,
    required: this.content.setup.successCountPerWord * this.content.words.length, total: 0,
    requiredPerWord: this.content.setup.successCountPerWord,
    perWord: this.content.words.reduce((prev, word) => { prev[word.toLearnText] = 0; return prev; }, {}),
    wonTime: undefined as number | undefined, 
    loseTime: undefined as number | undefined,
    lastHealthLostTime: undefined as number | undefined, 
    lastScoreIncreasedTime: undefined as number | undefined,
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
    if (this._score.loseTime || this._score.wonTime) {
      if (this._targets.candidates.length === 0) {
        this._targets.candidates = randomNInArray(this.content.words, dropSettings.movieSetup.maxWordsTillQuest + 1);
      }
    } else {
      if (this._targets.candidates.length === 0 || !this._targets.candidates.includes(this._quest)) {
        this._targets.candidates = randomNInArray(this.content.words, this.content.setup.maxWordsTillQuest + 1);
        if (!this._targets.candidates.includes(this._quest)) {
          this._targets.candidates[Math.floor(Math.random() * this._targets.candidates.length)] = this._quest;
        }
      }
    }
    const word = this._targets.candidates.pop() as WordWithImage;
    const x = this.preparedPos.clickableGameX + Math.random() * this.preparedPos.clickableGameWidth, y = settings.dimensions.heigth + settings.gui.icon.height * 1.5;
    return { word, x, y, timeGenerated: this._lastTick };
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
          this._score.lastScoreIncreasedTime = this._lastTick;
          this.onProgressSuccess?.(target.word, this._targets.partners);
          this._targets.partners = [];
        }
        if (this._score.total == this._score.required) {
          this._targets.nextGeneration = dropSettings.movieSetup.targets.cd;
          this._score.wonTime = this._lastTick;
          clearInterval(this._timer);
          this._timer = setInterval(this.onWinTick.bind(this), 1000 / dropSettings.fps);
          setTimeout(() => this.stop({ isSuccess: true, name: "drop" }), dropSettings.winTime);
        } else {
          this._quest = this.generateQuest();
        }
      } else if ((isMiss && isQuest) || (isHit && !isQuest)) {
        this._score.health = this._score.health - 1;
        this._score.lastHealthLostTime = this._lastTick;
        this.onProgressFail?.(this._quest, [target.word]);
        this._targets.partners = [];
        if (this._score.health == 0) {
          this._targets.nextGeneration = dropSettings.movieSetup.targets.cd;
          this._score.loseTime = this._lastTick;
          clearInterval(this._timer);
          this._timer = setInterval(this.onLoseTick.bind(this), 1000 / dropSettings.fps);
          setTimeout(() => this.stop({ isSuccess: false, name: "drop" }), dropSettings.loseTime);
        }
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
  private lostMotion() {
    // move & remove
    let speed = dropSettings.movieSetup.targets.speed;
    this._targets.a.forEach((target, i) => {
      if (target.y < settings.gui.status.height - target.word.toLearnImg.height) {
        this._targets.a.splice(i, 1);
        this._score.lastHealthLostTime = this._lastTick;
      } 
      else target.y -= speed;
    });
    // generate new
    if (this._targets.nextGeneration <= 0) {
      let target = this.generateTarget();
      for (let i = 0; i < 10 && Math.abs(target.x - this._hero.x) < settings.gui.icon.width * 2; i++)
        target.x = this.init.prepared.gameX + Math.random() * this.preparedPos.clickableGameWidth;
      this._targets.a.push(target);
      this._targets.nextGeneration = dropSettings.movieSetup.targets.cd;
    } else {
      this._targets.nextGeneration -= 1000 / dropSettings.fps;
    }
  }
  private wonMotion() {
    // move & remove
    this._targets.a.forEach((target, i) => {
      const isHit = (Math.abs(this._hero.x - target.x) <= settings.gui.icon.width) && (Math.abs(this._hero.y - target.y) <= settings.gui.icon.height);
      if (isHit) {
        // remove
        this._targets.a.splice(i, 1);
        this._score.lastScoreIncreasedTime = this._lastTick;
        return;
      } else {
        // x move
        if (target.y < this._hero.y + settings.gui.icon.height * 4) {
          if (target.x > this._hero.x) {
            target.x = Math.max(this._hero.x, target.x - dropSettings.movieSetup.targets.speed);
          } else {
            target.x = Math.min(this._hero.x, target.x + dropSettings.movieSetup.targets.speed);
          }
        }
        // y move
        if (target.y > this._hero.y) {
          target.y = Math.max(this._hero.y, target.y - dropSettings.movieSetup.targets.speed);
        }
      }
    });
    // generate new
    if (this._targets.nextGeneration <= 0) {
      this._targets.a.push(this.generateTarget());
      this._targets.nextGeneration = dropSettings.movieSetup.targets.cd;
    } else {
      this._targets.nextGeneration -= 1000 / dropSettings.fps;
    }
  }
  private motion() {
    if (this._mouse.x) {
      if (this._hero.x > this._mouse.x - settings.gui.icon.width / 2)
        this._hero.x = Math.max(this._hero.x - this._hero.speed, this._mouse.x - settings.gui.icon.width / 2); 
      else 
        this._hero.x = Math.min(this._hero.x + this._hero.speed, this._mouse.x - settings.gui.icon.width / 2);
      // fix
      this._hero.x = Math.max(this.init.prepared.gameX, Math.min(this.preparedPos.clickableGameXMax, this._hero.x));
    }
    let speed = this._targets.speed;
    let betaTime = 1000 / dropSettings.fps;
    if (this._mouse.accelerationKB || this._mouse.acceleration) {
      speed *= dropSettings.acceleration;
      betaTime *= dropSettings.acceleration;
    } 
    this._targets.a.forEach((target) => target.y -= speed);
    this._targets.nextGeneration -= betaTime;
  }
  private drawGameBackground() {
    this.init.ctx.fillStyle = settings.colors.sky;
    this.init.ctx.fillRect(this.init.prepared.gameX, settings.gui.status.height, this.init.prepared.gameWidth, settings.dimensions.heigth);
  }
  private drawTargets() {
    for (const target of this._targets.a) {
      this.init.ctx.drawImage(target.word.toLearnImg, target.x,target.y, target.word.toLearnImg.width, target.word.toLearnImg.height);
    }
  }
  private drawHero() {
    this.init.ctx.fillStyle = "#03fc28";
    this.init.ctx.fillRect(this._hero.x, this._hero.y, settings.gui.icon.width, settings.gui.icon.height);
  }
  private render() {
    drawBackground(this.init.ctx);
    this.drawGameBackground();
    this.drawHero();
    this.drawTargets();
    drawStatusText(this.init, this._quest.toLearnText, this._score.total, this._score.required, this._score.health, this.prepared);
  }
  private onTick() {
    this.motion();
    this.gameplay();
    this.render();
  }
  private onLoseTick() {
    this.lostMotion();
    this.render();
  }
  private onWinTick() {
    this.wonMotion();
    this.render();
  }
  protected start(): void {
    this._quest = this.generateQuest();
    this.render();
    this._timer = setInterval(this.onTick.bind(this), 1000 / dropSettings.fps)
  }
  protected freeResources(): void {
    clearInterval(this._timer);
    this.stopMouse();
    this.stopLeft();
    this.stopRight();
    this.stopSpace();
  }
  protected prepare() {
    return {
      ...prepareStatusText(this.init)
    };
  }
  protected preparePos() {
    return preparePos(this.init);
  }
  protected redraw() {
    this.render();
  }
  protected scrollOptions() {
    return {
      oneStep: 0,
      maxHeight: 0,
    }
  }
  protected resize() {
  }
}

export default Drop;
