import { AbstractGame, EndGameStats, UnloadedWord } from ".";
import { Button } from "../gui/button";
import { Init } from "../init";
import { formSettings } from "./form/settings";
import { randomNInArray } from "../utils";
import Form from "./form/game";
import AbstractButton from "../gui/abstractButton";

class Menu extends AbstractGame<UnloadedWord[], ReturnType<typeof Menu.prepare>, ReturnType<typeof Menu.preparePos>, EndGameStats> {
  private _buttons: AbstractButton<any, any, any, any>;
  
  private static prepare(init: Init) {
    return {};
  }
  protected prepare() {
    return Menu.prepare(this.init);
  }

  private static preparePos() {
    return {};
  }
  protected preparePos() {
    return Menu.preparePos();
  }
  
  protected freeResources() {
    
  }
  protected redraw() {
    
  }
  protected scrollOptions() {
    return {
      oneStep: 0,
      maxHeight: 0,
    }
  }
  protected update() {
    
  }
  protected start() {
    
  }
}

export default Menu;