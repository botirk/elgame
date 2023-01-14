import { AbstractGame } from "./games";
import Menu, { initMenu, MenuInit } from "./games/menu";
import { Init } from "./init";

class Nav {
  constructor(init: Init) {
    this._init = init;
    this.init();
  }

  private _init: Init;
  private _menuInit: MenuInit;
  private _curGame?: AbstractGame<any, any, any, any>;

  private async init() {
    this._menuInit = await initMenu(this._init);
    window.addEventListener("popstate", () => {
      if (this._curGame) {
        this._curGame?.stop();
        this._curGame = undefined;
      } 
    });
    this.showMenu();
  }

  private showMenu() {
    const menu = new Menu(this._init, this._menuInit);
    menu.onGameEnd.push((result) => {
      this._curGame = result?.game();
      history.pushState(`elgame${Math.floor(Math.random() * 1000)}`, "");
      this._curGame?.onGameEnd.push(() => this.showMenu());
    });
  }
}

export default Nav;
