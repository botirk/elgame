import Scroll, { ScrollOptions } from "../gui/events/scroll";
import FullscreenButton from "../gui/fullscreenButton";
import { Init, reprepareInit } from "../init";
import { DropGameDifficulty, FormGameDifficulty } from "../settings";
import { promiseMagic } from "../utils";

export interface EndGameStats {
  isSuccess: boolean
}

export type Game = () => Promise<EndGameStats>;

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
    place: number,
    openPlace: number[],
    label: string,
    words: string[],
  }[],
  form: {
    place: number,
    openPlace: number[],
    label: string,
    words: string[],
    difficulty: FormGameDifficulty,
  }[],
  memory: {
    place: number,
    openPlace: number[],
    label: string,
    words: string[],
  }[],
  drop: {
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
  protected abstract onGameStart(): void;
  protected abstract onGameEnd(): void;
  protected abstract redraw(): void;
  protected abstract update(): void;
  protected abstract scrollOptions(): { oneStep: number, maxHeight: number };
  constructor(init: Init, initialContent: TContent) {
    this.init = init;
    this.content = initialContent;
    const magic = promiseMagic<TEndGameStats>(() => {
      this._fullScreenButton.stop();
      this.scroll.stop();
      this._stopResize();
      this.onGameEnd();
    });
    this.promise = magic[0];
    this.gameEnder = magic[1];
    this._prepared = this.prepare();
    this._preparedPos = this.preparePos();
    this._fullScreenButton = new FullscreenButton(init, () => this.redraw());
    this._stopResize = init.addResizeRequest(() => {
      init.prepared = reprepareInit(init);
      this._preparedPos = this.preparePos();
      this.scroll.update();
      this.update();
      this.redraw();
    });
    this.scroll = new Scroll(init, () => ({ ...this.scrollOptions(), redraw: () => this.redraw(), update: () => this.update() }));
    this.onGameStart();
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
  readonly promise: Promise<EndGameStats>;
  protected readonly gameEnder: (result: TEndGameStats) => void;
}
