import { AbstractGame, UnloadedWord } from "./games";
import Menu from "./games/menu";
import { Init } from "./init";
import { suggestGame } from "./learner";

class Nav {
  constructor(init: Init, words: UnloadedWord[]) {
    this._init = init;
    this._words = words;
    window.addEventListener("popstate", () => {
      if (this._curGame) {
        this._curGame?.stop();
        this._curGame = undefined;
      } 
    });
    this.showMenu();
  }

  private _init: Init;
  private _words: UnloadedWord[];
  private _suggestion: ReturnType<typeof suggestGame>;
  private _curGame?: AbstractGame<any, any, any, any>;

  private refreshSuggestion() {
    this._suggestion = suggestGame(this._init, this._words);
  }

  private showMenu(noRefresh?: boolean) {
    if (!noRefresh) this.refreshSuggestion();
    const menu = new Menu(this._init, this._suggestion);
    menu.onGameEnd.push((result) => {
      if (result?.isViewer) this.showWords();
      else this.playGame();
    });
  }

  private async showWords() {
    const viewer = await this._suggestion.viewer();
    viewer.onGameEnd.push(() => this.showMenu(true));
  }

  private async playGame() {
    this._curGame = await this._suggestion.game()
    history.pushState(`elgame${Math.floor(Math.random() * 1000)}`, "");
    this._curGame.onGameEnd.push(() => this.showMenu());
  }
}

export default Nav;
