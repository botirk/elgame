import sounds from "../src/compileTime/generated/sounds.json";

import { AbstractGame, EndGameStats, UnloadedWord } from "./games";
import Menu from "./games/menu";
import SoundSetup from "./games/soundSetup";
import { Init } from "./init";
import { suggestGame, saveProgress, allViewer, loadProgress } from "./learner";

class Nav {
  constructor(private _init: Init, private _words: UnloadedWord[]) {
    window.addEventListener("popstate", () => {
      if (this._curGame) {
        this._curGame?.stop();
        this._curGame = undefined;
      } 
    });
    this.showSoundSetup().then((sound) => {
      this.showMenu();
      this.playBackgroundSound(sound);
    });
  }

  private _suggestion: ReturnType<typeof suggestGame>;
  private _curGame?: AbstractGame<any, any, any, EndGameStats>;

  private refreshSuggestion() {
    this._suggestion = suggestGame(this._init, this._words);
  }

  private async showSoundSetup() {
    return !!(await new SoundSetup(this._init, {}).onGameEnd)?.isSuccess;
  }

  private async showMenu(noRefresh?: boolean) {
    if (!noRefresh) this.refreshSuggestion();
    const result = await new Menu(this._init, this._suggestion).onGameEnd;
    noRefresh = !!result?.isViewer;
    history.pushState(`elgame${Math.floor(Math.random() * 1000)}`, "");
    if (result?.isViewer) await this.showWords();
    else if (result?.isInfinity) await this.playInfinity();
    else if (result?.isAllViewer) await this.showAllWords();
    else if (!(await this.playGame())?.isSuccess) noRefresh = true;
    this.showMenu(noRefresh);
  }

  private async showWords() {
    this._curGame = await this._suggestion.viewer();
    await this._curGame.onGameEnd;
  }
  
  private async showAllWords() {
    this._curGame = await allViewer(this._init, this._words);
    await this._curGame.onGameEnd;
  }

  private async playGame() {
    this._curGame = await this._suggestion.game();
    saveProgress(this._curGame);
    return await this._curGame.onGameEnd;
  }

  static audio: HTMLAudioElement;
  private async playBackgroundSound(isUnmuted: boolean) {
    Nav.audio = new Audio(`data:audio/mp3;base64,${sounds.theme}`);
    await new Promise<void>((resolve) => {
      Nav.audio.addEventListener("loadeddata", () => {
        resolve();
      });
    });
    Nav.audio.muted = !isUnmuted;
    Nav.audio.play();
  }

  private async playInfinity() {
    while (true) {
      const result = await this.playGame();
      if (!result) break;
      this._suggestion = suggestGame(this._init, this._words);
    }
  }
}

export default Nav;
