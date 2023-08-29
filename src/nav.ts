import { AbstractGame, EndGameStats, UnloadedWord } from "./games";
import CTX from "./gui/CTX";

class Nav {
  constructor(private _ctx: CTX, private _words: UnloadedWord[]) {
    window.addEventListener("popstate", () => {
      if (this._curGame) {
        this._curGame?.stop();
        this._curGame = undefined;
      } 
    });
    this.showMenu();
  }

  private _curGame?: AbstractGame<any, any, any, EndGameStats>;

  private async showMenu(noRefresh?: boolean) {
    /*const result = await new Menu(this._ctx).onGameEnd;
    noRefresh = !!result?.isViewer;
    history.pushState(`elgame${Math.floor(Math.random() * 1000)}`, "");
    if (result?.isViewer) await this.showWords();
    else if (result?.isInfinity) await this.playInfinity();
    else if (result?.isAllViewer) await this.showAllWords();
    else if (!(await this.playGame())?.isSuccess) noRefresh = true;
    this.showMenu(noRefresh);*/
  }
}

export default Nav;
