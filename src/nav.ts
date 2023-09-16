import { AbstractGame, EndGameStats, Word } from "./games";
import Menu from "./games/menu";
import CTX from "./gui/CTX";

class Nav {
  constructor(private ctx: CTX) {
    this.onPopState = this.onPopState.bind(this);
    window.addEventListener("popstate", this.onPopState);
    this.showMenu();
  }

  private curGame?: AbstractGame<any, EndGameStats>;

  private async showMenu() {
    const result = await new Menu(this.ctx, undefined).start().onGameEnd;
    history.pushState(`elgame${Math.floor(Math.random() * 1000)}`, "");
    await this.playGame(new Date());
    this.showMenu();
  }

  private async playGame(endTime: Date) {
    this.curGame = this.ctx.progress.suggestGame(endTime).start();
    await this.curGame.onGameEnd;
  }

  private onPopState() {
    if (this.curGame) {
      this.curGame?.stop();
      this.curGame = undefined;
    }
  }
}

export default Nav;
