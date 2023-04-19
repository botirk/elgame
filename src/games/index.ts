import Scroll from "../gui/events/scroll";
import FullscreenButton from "../gui/fullscreenButton";
import { Init, reprepareInit } from "../init";
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

export abstract class AbstractGame<TContent, TPrepare extends Object, TPreparePos extends Object, TEndGameStats extends EndGameStats> {
  protected abstract prepare(): TPrepare;
  protected abstract preparePos(): TPreparePos;
  protected abstract start(): void;
  protected abstract freeResources(): void;
  protected abstract redraw(): void;
  protected abstract resize(): void;
  protected scroll() {};
  protected abstract scrollOptions(): { oneStep: number, maxHeight: number };
  constructor(init: Init, initialContent: TContent) {
    this.init = init;
    this.content = initialContent;
    this._prepared = this.prepare();
    this._preparedPos = this.preparePos();
    this._fullScreenButton = new FullscreenButton(init, () => this.redraw());
    this._stopResize = init.addResizeRequest(() => {
      init.prepared = reprepareInit(init);
      this._preparedPos = this.preparePos();
      this._fullScreenButton.dynamic();
      this.scrollEvent.update();
      this.resize();
      this.redraw();
      this.scrollEvent.drawScroll();
    });
    this.scrollEvent = new Scroll(init, () => this.redraw(), () => this.scroll(), () => this.scrollOptions());

    [this.onGameEnd, this.stop] = promiseMagic<TEndGameStats | undefined>(() => {
      this._fullScreenButton.stop();
      this.scrollEvent.stop();
      this._stopResize();
      this.freeResources();
    });

    setTimeout(() => { 
      this.start(); 
      this.scrollEvent.update();
      this.redraw(); 
    }, 1);
  }
  
  private _prepared: TPrepare;
  protected get prepared() { return this._prepared; }
  private _preparedPos: TPreparePos;
  protected get preparedPos() { return this._preparedPos; }
  private _fullScreenButton: FullscreenButton;
  private _stopResize: ReturnType<Init["addResizeRequest"]>;
  
  protected readonly scrollEvent: Scroll;
  protected readonly init: Init;
  protected readonly content: TContent;
 
  onGameEnd: Promise<TEndGameStats | undefined>;
  onProgressSuccess?: typeof saveProgressSuccess;
  onProgressFail?: typeof saveProgressFail;
  stop: (result?: TEndGameStats) => void;
}
