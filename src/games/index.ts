import Scroll, { ScrollOptions } from "../gui/events/scroll";
import FullscreenButton from "../gui/fullscreenButton";
import { Init, reprepareInit } from "../init";
import { promiseMagic } from "../utils";
import { DropGameDifficulty } from "./drop/settings";
import { FormGameDifficulty } from "./form/settings";

export interface EndGameStats {
  isSuccess: boolean
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

export interface Plan {
  viewer: {
    openedInitialy?: boolean,
    place: number,
    openPlace: number[],
    label: string,
    words: string[],
  }[],
  form: {
    openedInitaly?: boolean,
    place: number,
    openPlace: number[],
    label: string,
    words: string[],
    difficulty: FormGameDifficulty,
  }[],
  memory: {
    openedInitaly?: boolean,
    place: number,
    openPlace: number[],
    label: string,
    words: string[],
  }[],
  drop: {
    openedInitaly?: boolean,
    place: number,
    openPlace: number[],
    label: string,
    words: string[],
    difficulty: DropGameDifficulty,
  }[]
}

export abstract class AbstractGame<TContent, TPrepare extends Object, TPreparePos extends Object, TEndGameStats extends EndGameStats> {
  protected abstract prepare(): TPrepare;
  protected abstract preparePos(): TPreparePos;
  protected abstract start(): void;
  protected abstract freeResources(): void;
  protected abstract redraw(): void;
  protected abstract update(): void;
  protected abstract scrollOptions(): { oneStep: number, maxHeight: number };
  constructor(init: Init, initialContent: TContent, isLateGlue?: boolean) {
    this.init = init;
    this.content = initialContent;
    this._prepared = this.prepare();
    this._preparedPos = this.preparePos();
    this._fullScreenButton = new FullscreenButton(init, () => this.redraw());
    this._stopResize = init.addResizeRequest(() => {
      init.prepared = reprepareInit(init);
      this._preparedPos = this.preparePos();
      this._fullScreenButton.dynamicPos();
      this.scroll.update();
      this.update();
      this.redraw();
      this.scroll.drawScroll();
    });
    this.scroll = new Scroll(init, () => ({ ...this.scrollOptions(), redraw: () => this.redraw(), update: () => this.update() }));
    if (!isLateGlue) this.start();
  }
  
  private _prepared: TPrepare;
  protected get prepared() { return this._prepared; }
  private _preparedPos: TPreparePos;
  protected get preparedPos() { return this._preparedPos; }
  private _fullScreenButton: FullscreenButton;
  private _stopResize: ReturnType<Init["addResizeRequest"]>;
  
  protected readonly scroll: Scroll;
  protected readonly init: Init;
  protected readonly content: TContent;
 
  onGameEnd: ((result?: TEndGameStats) => void)[] = [];
  stop(result?: TEndGameStats) {
    this._fullScreenButton.stop();
    this.scroll.stop();
    this._stopResize();
    this.freeResources();
    this?.onGameEnd.forEach((e) => e(result));
  }
}
