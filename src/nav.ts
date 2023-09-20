import { AbstractGame } from "./games";
import Menu from "./games/menu";
import CTX from "./CTX";
import Status from "./gui/status";

class Nav {
  constructor(private ctx: CTX) {
    this.onPopState = this.onPopState.bind(this);
    window.addEventListener("popstate", this.onPopState);
    this.showMenu();
  }

  private curGame?: AbstractGame<any, any>;

  private async showMenu() {
    const result = await new Menu(this.ctx, undefined).start().onGameEnd;
    history.pushState(`elgame${Math.floor(Math.random() * 1000)}`, "");
    await this.playGame(new Date((new Date()).getTime() + (5 * 60 * 1000)));
    this.showMenu();
  }

  private async playGame(endTime: Date) {
    this.ctx.status = new Status(this.ctx, endTime);
    let now = new Date();
    const words = this.ctx.suggest.wordsToLearn(endTime, now);
    while(endTime > now) {
      this.curGame = this.ctx.suggest.game(words, now).start();
      const result = await this.curGame?.onGameEnd;
      if (result?.isStopped) break;
      now = new Date();
    }
    this.ctx.status.stop();
  }

  private onPopState() {
    if (this.curGame) {
      this.curGame?.stop({ isStopped: true });
      this.curGame = undefined;
    }
  }
}

export default Nav;
