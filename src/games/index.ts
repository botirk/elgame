import CTX from "../gui/CTX";
import { saveProgressFail, saveProgressSuccess } from "../learner";
import { promiseMagic } from "../utils";


export type GameName = "form" | "drop" | "memory";

export interface EndGameStats {
  isSuccess: boolean,
  name?: GameName,
}

export type Game = () => AbstractGame<any, any, any, EndGameStats>;

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

export abstract class AbstractGame<TContent, TPrepare extends any, TPreparePos extends any, TEndGameStats extends EndGameStats> {
  constructor(protected readonly ctx: CTX, protected readonly content: TContent) { }

  init() {
    [this.onGameEnd, this.stop] = promiseMagic<TEndGameStats | undefined>(() => this.freeResources());
    this.start();
    this.ctx.innerRedraw = this.innerRedraw.bind(this);
    this.ctx.redraw();
    return this;
  }

  protected abstract prepare(): TPrepare;
  protected abstract preparePos(): TPreparePos;
  protected abstract start(): void;
  protected abstract freeResources(): void;
  protected abstract innerRedraw(): void;
  protected scroll() {};
  protected abstract scrollOptions(): { oneStep: number, maxHeight: number };
  
  private _prepared: TPrepare = this.prepare();
  protected get prepared() { return this._prepared; }
  private _preparedPos: TPreparePos = this.preparePos();
  protected get preparedPos() { return this._preparedPos; }
 
  onGameEnd: Promise<TEndGameStats | undefined>;
  onProgressSuccess?: typeof saveProgressSuccess;
  onProgressFail?: typeof saveProgressFail;
  stop: (result?: TEndGameStats) => void;
}
