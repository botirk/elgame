import CTX from "../CTX";
import { saveProgressFail, saveProgressSuccess } from "../learner";
import { promiseMagic } from "../utils";


export type GameName = "form" | "drop" | "memory";

export interface EndGameStats {
  isStopped?: boolean
}

export type Game = () => AbstractGame<any, any>;

export interface UnloadedWord {
  toLearnText: string,
  toLearnImgB64?: string,
  translation?: string,
}

export interface Word {
  toLearnText: string,
  toLearnImg?: HTMLImageElement,
  translation?: string,
}

export interface WordWithImage extends Word {
  toLearnImg: HTMLImageElement,
}

export interface WordWithTranslation extends Word {
  translation: string,
}

export abstract class AbstractGame<TContent, TEndGameStats extends EndGameStats> {
  constructor(protected readonly ctx: CTX, protected readonly content: TContent) { }

  start() {
    [this.onGameEnd, this.stop] = promiseMagic<TEndGameStats | undefined>(() => this.freeResources());
    this.init();
    this.ctx.innerRedraw = this.innerRedraw.bind(this);
    this.ctx.redraw();
    return this;
  }
  protected abstract init(): void;
  protected abstract freeResources(): void;
  protected abstract innerRedraw(): void;
  protected scroll() {};
 
  onGameEnd: Promise<TEndGameStats | undefined>;
  stop: (result?: TEndGameStats) => void;
}
