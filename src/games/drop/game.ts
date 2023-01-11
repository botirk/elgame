import settings, { dropGame, DropGameDifficulty } from "../../settings";
import { drawFrame, Prepared as PreparedDraw, prepare as prepareDraw, prepareQuestX } from "./draw";
import { Init } from "../../init";
import { mergeDeep, promiseMagic, randomInArray, RecursivePartial } from "../../utils";
import { reprepareInit } from "../../init";
import FullscreenButton from "../../gui/fullscreenButton";
import { AbstractGame, Word, WordWithImage } from "..";
import { EndGameStats, Game } from "..";
import { drawStatusText, prepareStatusText } from "../../gui/status";
import { randomNInArray } from "../../utils";
import drawBackground from "../../gui/background";

const generateTarget = (init: Init, state: DropState) => {
  const x = state.gameplay.prepared.clickableGameX + Math.random() * state.gameplay.prepared.clickableGameWidth, y = 1000;
  const word = randomInArray(state.gameplay.targets.candidates);
  if (state.gameplay.targets.candidates.length == 0 || (state.gameplay.targets.candidates.length == 1 && state.gameplay.words.length <= 2)) {
    state.gameplay.targets.candidates = [...state.gameplay.words];
  } else if (state.gameplay.targets.candidates.length == 1) {
    state.gameplay.targets.candidates = state.gameplay.words.filter((word) => word != state.gameplay.targets.candidates[0]);
  } else {
    state.gameplay.targets.candidates.splice(state.gameplay.targets.candidates.indexOf(word), 1);
  }
  return { word, x, y, timeGenerated: state.lastTick };
}

const generateQuest = (init: Init, words: WordWithImage[], state?: DropState) => {
  let wordsAvailable = words;
  if (state) {
    const remaining = state.gameplay.words.filter((word) => state.gameplay.score.perWord[word.toLearnText] < state.gameplay.score.requiredPerWord);
    if (remaining.length == 1) {
      wordsAvailable = remaining;
    } else if (remaining.length > 0) {
      wordsAvailable = remaining.filter((word) => word != state.gameplay.quest.word);
    }
  }
  const word = randomInArray(wordsAvailable);
  return { word, timeGenerated: state?.lastTick || Date.now() };
}

const calcGameplay = (init: Init, state: DropState) => {
  state.gameplay.targets.a.forEach((target, i) => {
    const isMiss = (target.y < settings.gui.status.height - target.word.toLearnImg.height);
    const isHit = (Math.abs(state.gameplay.hero.x - target.x) <= settings.gui.icon.width) && (Math.abs(state.gameplay.hero.y - target.y) <= settings.gui.icon.height);
    const isQuest = (target.word == state.gameplay.quest.word);
    if (isHit && isQuest) {
      if (state.gameplay.score.perWord[state.gameplay.quest.word.toLearnText] < state.gameplay.score.requiredPerWord) {
        state.gameplay.score.perWord[state.gameplay.quest.word.toLearnText] += 1;
        state.gameplay.score.total += 1;
        state.gameplay.score.lastScoreIncreasedTime = state.lastTick;
      }
      if (state.gameplay.score.total == state.gameplay.score.required) {
        state.gameplay.targets.nextGeneration = dropGame.difficulties.movie.targets.cd;
        state.gameplay.score.wonTime = state.lastTick;
      } else {
        state.gameplay.quest = generateQuest(init, state.gameplay.words, state);
        state.gui.prepared.questX = prepareQuestX(init, state.gameplay.quest.word.toLearnText);
      }
    } else if ((isMiss && isQuest) || (isHit && !isQuest)) {
      state.gameplay.score.health = state.gameplay.score.health - 1;
      state.gameplay.score.lastHealthLostTime = state.lastTick;
      if (state.gameplay.score.health == 0) {
        state.gameplay.targets.nextGeneration = dropGame.difficulties.movie.targets.cd;
        state.gameplay.score.loseTime = state.lastTick;
      }
    }
    if (isHit || isMiss) state.gameplay.targets.a.splice(i, 1);
  });
  // generate new
  if (state.gameplay.targets.nextGeneration <= 0) {
    state.gameplay.targets.a.push(generateTarget(init, state));
    state.gameplay.targets.nextGeneration = state.gameplay.targets.cd;
  }
}

const calcNextFrame = (init: Init, state: DropState) => {
  if (state.gui.mouse.x) {
    if (state.gameplay.hero.x > state.gui.mouse.x - settings.gui.icon.width / 2)
      state.gameplay.hero.x = Math.max(state.gameplay.hero.x - state.gameplay.hero.speed, state.gui.mouse.x - settings.gui.icon.width / 2); 
    else 
      state.gameplay.hero.x = Math.min(state.gameplay.hero.x + state.gameplay.hero.speed, state.gui.mouse.x - settings.gui.icon.width / 2);
    // fix
    state.gameplay.hero.x = Math.max(init.prepared.gameX, Math.min(state.gameplay.prepared.clickableGameXMax, state.gameplay.hero.x));
  }
  let speed = state.gameplay.targets.speed;
  let betaTime = 1000 / dropGame.fps;
  if (state.gui.accelerationKB || state.gui.accelerationMouse) {
    speed *= dropGame.acceleration;
    betaTime *= dropGame.acceleration;
  } 
  state.gameplay.targets.a.forEach((target) => target.y -= speed);
  state.gameplay.targets.nextGeneration -= betaTime;
}

const calcNextLoseFrame = (init: Init, state: DropState) => {
  // move & remove
  let speed = dropGame.difficulties.movie.targets.speed;
  state.gameplay.targets.a.forEach((target, i) => {
    if (target.y < settings.gui.status.height - target.word.toLearnImg.height) {
      state.gameplay.targets.a.splice(i, 1);
      state.gameplay.score.lastHealthLostTime = state.lastTick;
    } 
    else target.y -= speed;
  });
  // generate new
  if (state.gameplay.targets.nextGeneration <= 0) {
    let target = generateTarget(init, state);
    for (let i = 0; i < 10 && Math.abs(target.x - state.gameplay.hero.x) < settings.gui.icon.width * 2; i++)
      target.x = init.prepared.gameX + Math.random() * state.gameplay.prepared.clickableGameWidth;
    state.gameplay.targets.a.push(target);
    state.gameplay.targets.nextGeneration = dropGame.difficulties.movie.targets.cd;
  } else {
    state.gameplay.targets.nextGeneration -= 1000 / dropGame.fps;
  }
}

const calcNextWonFrame = (init: Init, state: DropState) => {
  // move & remove
  state.gameplay.targets.a.forEach((target, i) => {
    const isHit = (Math.abs(state.gameplay.hero.x - target.x) <= settings.gui.icon.width) && (Math.abs(state.gameplay.hero.y - target.y) <= settings.gui.icon.height);
    if (isHit) {
      // remove
      state.gameplay.targets.a.splice(i, 1);
      state.gameplay.score.lastScoreIncreasedTime = state.lastTick;
      return;
    } else {
      // x move
      if (target.y < state.gameplay.hero.y + settings.gui.icon.height * 4) {
        if (target.x > state.gameplay.hero.x) {
          target.x = Math.max(state.gameplay.hero.x, target.x - dropGame.difficulties.movie.targets.speed);
        } else {
          target.x = Math.min(state.gameplay.hero.x, target.x + dropGame.difficulties.movie.targets.speed);
        }
      }
      // y move
      if (target.y > state.gameplay.hero.y) {
        target.y = Math.max(state.gameplay.hero.y, target.y - dropGame.difficulties.movie.targets.speed);
      }
    }
  });
  // generate new
  if (state.gameplay.targets.nextGeneration <= 0) {
    state.gameplay.targets.a.push(generateTarget(init, state));
    state.gameplay.targets.nextGeneration = dropGame.difficulties.movie.targets.cd;
  } else {
    state.gameplay.targets.nextGeneration -= 1000 / dropGame.fps;
  }
}

const prepare = (init: Init) => {
  return {
    maxXHero: init.prepared.gameXMax - settings.gui.icon.width, 
    maxXTarget: init.prepared.gameXMax - settings.gui.icon.width,
    clickableGameX: (init.ctx.canvas.width - init.prepared.gameWidth) / 2 + settings.gui.icon.width,
    clickableGameXMax: (init.ctx.canvas.width + init.prepared.gameWidth) / 2 - settings.gui.icon.width,
    clickableGameWidth: init.prepared.gameWidth - settings.gui.icon.width * 2,
  };
}
type Prepared = ReturnType<typeof prepare>;

export interface DropState {
  // gameplay
  gameplay: {
    direction?: "left" | "right",
    words: WordWithImage[],
    quest: { word: WordWithImage, timeGenerated: number },
    prevQuest?: DropState["gameplay"]["quest"],
    targets: {
      a: { word: WordWithImage, x: number, y: number, timeGenerated: number }[],
      candidates: WordWithImage[],
      speed: number,
      nextGeneration: number,
      cd: number,
    }
    hero: { x: number, y: number, speed: number },
    score: {
      health: number,
      total: number, required: number, requiredPerWord: number,
      perWord: { [word: string]: number },
      wonTime?: number, loseTime?: number,
      lastHealthLostTime?: number, lastScoreIncreasedTime?: number,
    },
    prepared: Prepared,
  }
  // gui
  gui: {
    mouse: { x?: number, y?: number },
    accelerationMouse: boolean, accelerationKB: boolean,
    prepared: PreparedDraw,
  }
  lastTick: number,
}

const drop = (init: Init, words: WordWithImage[], dif: DropGameDifficulty, optional?: RecursivePartial<DropState>) => async () => {
  const stopMove = init.addMoveRequest((x, y) => {
    state.gui.mouse.x = x, state.gui.mouse.y = y;
    state.gui.accelerationMouse = (y <= settings.gui.status.height);
  });
  const stopResize = init.addResizeRequest(() => {
    // change canvas size
    const {gameX: oldX, gameWidth: oldWidth } = init.prepared;
    init.prepared = reprepareInit(init);
    const {gameX: newX, gameWidth: newWidth } = init.prepared;
    // change targets
    state.gameplay.targets.a.forEach((target) => {
      const coef = (target.x - oldX) / oldWidth;
      target.x = newX + (coef * newWidth);
    });
    // change hero
    {
      const coef = (state.gameplay.hero.x - oldX) / oldWidth;
      state.gameplay.hero.x = newX + (coef * newWidth);
    }
    // change mouse
    if (state.gui.mouse.x) {
      const coef = (state.gui.mouse.x - oldX) / oldWidth;
      state.gui.mouse.x = newX + (coef * newWidth);
    }
    // recalculate
    state.gui.prepared = prepareDraw(init, state.gameplay.quest.word.toLearnText);
    state.gameplay.prepared = prepare(init);
    // move fs button
    buttonFS.dynamicPos();
    // render
    render();
  });
  const stopButton = init.addButtonRequest({
    button: " ", 
    onReleased: () => state.gui.accelerationKB = false,
    onPressed: () => state.gui.accelerationKB = true,
  });
  const stopRight = init.addButtonRequest({
    button: "ArrowRight",
    onPressed: () => { state.gui.mouse.x = Infinity; },
    onReleased: () => { state.gui.mouse.x = undefined; },
  });
  const stopLeft = init.addButtonRequest({
    button: "ArrowLeft",
    onPressed: () => { state.gui.mouse.x = -Infinity; },
    onReleased: () => { state.gui.mouse.x = undefined; },
  });
  const buttonFS = new FullscreenButton(init, () => render());

  // general state
  const quest = generateQuest(init, words);
  const state: DropState = mergeDeep({
    gameplay: {
      words,
      hero: {
        x: init.prepared.gameX + init.prepared.gameWidth / 2, y: dropGame.heroY, 
        speed: dropGame.mouseSpeed * init.prepared.verticalSpeedMultiplier 
      },
      quest,
      targets: {
        a: [],
        candidates: [...words],
        nextGeneration: 0,
        speed: dif.targets.speed,
        cd: dif.targets.cd,
      },
      score: {
        health: dif.maxHealth,
        required: dif.successCountPerWord * words.length, total: 0,
        requiredPerWord: dif.successCountPerWord,
        perWord: words.reduce((prev, word) => { prev[word.toLearnText] = 0; return prev; }, {}),
      },
      prepared: prepare(init),
    },
    gui: {
      mouse: { x: -1, y: -1 },
      accelerationKB: false,  accelerationMouse: false,
      prepared: prepareDraw(init, quest.word.toLearnText),
    },
    lastTick: 0,
  }, optional);
  
  // render
  const render = () => {
    state.lastTick = Date.now();
    if (state.gameplay.score.loseTime) {
      if (state.gameplay.score.loseTime + dropGame.loseTime > state.lastTick) {
        calcNextLoseFrame(init, state);
        drawFrame(init, state);
        buttonFS.redraw();
      } else {
        gameEnder({ isSuccess: false });
      }
    } else if (state.gameplay.score.wonTime) {
      if (state.gameplay.score.wonTime + dropGame.winTime > state.lastTick) {
        calcNextWonFrame(init, state);
        drawFrame(init, state);
        buttonFS.redraw();
      } else {
        gameEnder({ isSuccess: true });
      }
    } else {
      calcNextFrame(init, state); 
      calcGameplay(init, state); 
      drawFrame(init, state);
      buttonFS.redraw();
    }
  };
  const timer = setInterval(render, 1000 / dropGame.fps);

  // promise
  const [promise, gameEnder] = promiseMagic<EndGameStats>(() => {
    clearInterval(timer);
    stopButton();
    stopRight();
    stopLeft();
    stopMove();
    stopResize();
    buttonFS.stop(false);
  });
  return await promise;
}

const preparePos = (init: Init) => ({
  maxXHero: init.prepared.gameXMax - settings.gui.icon.width, 
  maxXTarget: init.prepared.gameXMax - settings.gui.icon.width,
  clickableGameX: (init.ctx.canvas.width - init.prepared.gameWidth) / 2 + settings.gui.icon.width,
  clickableGameXMax: (init.ctx.canvas.width + init.prepared.gameWidth) / 2 - settings.gui.icon.width,
  clickableGameWidth: init.prepared.gameWidth - settings.gui.icon.width * 2,
});

const prepareDrop =  (init: Init) => ({
  ...prepareStatusText(init)
})

interface DropContent { words: WordWithImage[], dif: DropGameDifficulty };

class Drop extends AbstractGame<DropContent, ReturnType<typeof prepareDrop>, ReturnType<typeof preparePos>, EndGameStats> {
  constructor(init: Init, content: DropContent) {
    super(init, content, true);
    this.onGameStart();
  }

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
    y: dropGame.heroY, 
    speed: dropGame.mouseSpeed * this.init.prepared.verticalSpeedMultiplier 
  }
  private _targets = {
    a: [] as { word: WordWithImage, x: number, y: number, timeGenerated: number }[],
    candidates: [] as WordWithImage[],
    nextGeneration: 0,
    speed: this.content.dif.targets.speed,
    cd: this.content.dif.targets.cd,
  }
  private _score = {
    health: this.content.dif.maxHealth,
    required: this.content.dif.successCountPerWord * this.content.words.length, total: 0,
    requiredPerWord: this.content.dif.successCountPerWord,
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
        this._targets.candidates = randomNInArray(this.content.words, dropGame.difficulties.movie.maxWordsTillQuest + 1);
      }
    } else {
      if (this._targets.candidates.length === 0 || !this._targets.candidates.includes(this._quest)) {
        this._targets.candidates = randomNInArray(this.content.words, this.content.dif.maxWordsTillQuest + 1);
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
        }
        if (this._score.total == this._score.required) {
          this._targets.nextGeneration = dropGame.difficulties.movie.targets.cd;
          this._score.wonTime = this._lastTick;
          clearInterval(this._timer);
          this._timer = setInterval(this.onWinTick.bind(this), 1000 / dropGame.fps);
          setTimeout(() => this.gameEnder({ isSuccess: true }), dropGame.winTime);
        } else {
          this._quest = this.generateQuest();
        }
      } else if ((isMiss && isQuest) || (isHit && !isQuest)) {
        this._score.health = this._score.health - 1;
        this._score.lastHealthLostTime = this._lastTick;
        if (this._score.health == 0) {
          this._targets.nextGeneration = dropGame.difficulties.movie.targets.cd;
          this._score.loseTime = this._lastTick;
          clearInterval(this._timer);
          this._timer = setInterval(this.onLoseTick.bind(this), 1000 / dropGame.fps);
          setTimeout(() => this.gameEnder({ isSuccess: false }), dropGame.loseTime);
        }
      }
      if (isHit || isMiss) this._targets.a.splice(i, 1);
    });
    // generate new
    if (this._targets.nextGeneration <= 0) {
      this._targets.a.push(this.generateTarget());
      this._targets.nextGeneration = this._targets.cd;
    }
  }
  private lostMotion() {
    // move & remove
    let speed = dropGame.difficulties.movie.targets.speed;
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
      this._targets.nextGeneration = dropGame.difficulties.movie.targets.cd;
    } else {
      this._targets.nextGeneration -= 1000 / dropGame.fps;
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
            target.x = Math.max(this._hero.x, target.x - dropGame.difficulties.movie.targets.speed);
          } else {
            target.x = Math.min(this._hero.x, target.x + dropGame.difficulties.movie.targets.speed);
          }
        }
        // y move
        if (target.y > this._hero.y) {
          target.y = Math.max(this._hero.y, target.y - dropGame.difficulties.movie.targets.speed);
        }
      }
    });
    // generate new
    if (this._targets.nextGeneration <= 0) {
      this._targets.a.push(this.generateTarget());
      this._targets.nextGeneration = dropGame.difficulties.movie.targets.cd;
    } else {
      this._targets.nextGeneration -= 1000 / dropGame.fps;
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
    let betaTime = 1000 / dropGame.fps;
    if (this._mouse.accelerationKB || this._mouse.acceleration) {
      speed *= dropGame.acceleration;
      betaTime *= dropGame.acceleration;
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
  protected onGameStart(): void {
    this._quest = this.generateQuest();
    this.render();
    this._timer = setInterval(this.onTick.bind(this), 1000 / dropGame.fps)
  }
  protected onGameEnd(): void {
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
    
  }
  protected scrollOptions() {
    return {
      oneStep: 0,
      maxHeight: 0,
    }
  }
  protected update() {
    
  }
}

export default Drop;
