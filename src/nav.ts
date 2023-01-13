import { AbstractGame } from "./games";
import { Menu } from "./games/menu";
import { Init } from "./init";

class Nav {
  constructor(init: Init) {
    this._init = init;
    this.showMenu();
  }

  private _init: Init;
  private _menuState: any;
  private _currentGame?: AbstractGame<any, any, any, any>;

  private async showMenu() {
    const menuResult = await new Menu(this._init).promise;
    const gameResult = await menuResult.game().promise;
    this.showMenu();
  }
}

export default Nav;
