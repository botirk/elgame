import { Init } from "../init";
import settings from "../settings";
import drawBackground from "../gui/background";
import { LoadedPlans, loadPlans } from "../asset";
import { calcTextWidth, drawTextAtCenter } from "../gui/text";
import { loadProgress, saveProgress } from "../progress";
import { ButtonWithDescription, calcButtonWithDescription } from "../gui/buttonWithDescription";
import AbstractButton from "../gui/abstractButton";
import { Button } from "../gui/button";
import { AbstractGame, EndGameStats, Game } from ".";
import { loadAssets, loadWords } from "../asset";

const calcMenu = (init: Init, plans: LoadedPlans, desc: string) => {
  // menu width
  const [minWidthGame, minHeight] = plans.reduce((prev, cur) => {
    const calced = calcButtonWithDescription(init, cur.name, cur.label);
    return [Math.max(calced.width + settings.gui.button.padding * 2, prev[0]), Math.max(calced.height + settings.gui.button.padding * 2, prev[1])]; 
  }, [0, 0]);
  const minWidthDesc = calcTextWidth(init.ctx, desc) + settings.gui.button.padding * 2;

  // menu x/y
  const isNarrow = () => init.ctx.canvas.width < minWidthGame + settings.gui.button.distance * 4 + minWidthDesc * 2;
  const xGame = () => init.ctx.canvas.width / 2;
  const xDescDesktop = () => xGame() - minWidthGame / 2 - settings.gui.button.distance - minWidthDesc / 2;
  const xDescMobile = xGame;
  const xDesc = () => isNarrow() ? xDescMobile() : xDescDesktop();
  const yGameDesktop = (count: number, scrollPos: number) => -scrollPos + settings.gui.button.distance + minHeight / 2 + ((count - 1) * (minHeight + settings.gui.button.distance));
  const yGameMobile = (count: number, i: number, scrollPos: number) => {
    // starting marging + block margin + button margin
    return -scrollPos + settings.gui.button.distance + minHeight / 2  + (count - 1) * settings.gui.button.distance + (i * (minHeight + settings.gui.button.distance));
  }
  const yGame = (count: number, i: number, scrollPos: () => number) => () => isNarrow() ? yGameMobile(count, i, scrollPos()) : yGameDesktop(count, scrollPos());
  const yDescDesktop = yGameDesktop;
  const yDescMobile = yGameMobile;
  const yDesc = (count: number, i: number, scrollPos: () => number) => () => isNarrow() ? yDescMobile(count, i, scrollPos()) : yDescDesktop(count, scrollPos());
  const minWidth = () => isNarrow() ? minWidthGame : minWidthDesc;
  const totalHeight = () => {
    if (isNarrow()) {
      // two buttons per plan + blocks margin + margin at botton - one "all words" button at top
      return (settings.gui.button.distance + minHeight) * 2 * plans.length + settings.gui.button.distance * (plans.length - 1) + settings.gui.button.distance - (settings.gui.button.distance + minHeight);
    } else {
      return (settings.gui.button.distance + minHeight) * plans.length + settings.gui.button.distance;
    }
  }
  return { xGame, xDesc, yGame, yDesc, minWidth, minWidthGame, minHeight, totalHeight };
}

export const initMenu = async (init: Init) => {
  const imgs = await loadAssets(settings.gui.icon.width, "width");
  const words = await loadWords(settings.gui.icon.width, "width");
  const plans = loadPlans(init, words);
  return { plans, imgs, words };
}
export type MenuInit = Awaited<ReturnType<typeof initMenu>>;

const prepare = (init: Init, plans: LoadedPlans, desc: string) => {
  const pos = calcMenu(init, plans, desc);
  const progress = loadProgress(init);
  return { pos, progress };
}

interface MenuEnd extends EndGameStats { game: Game; }

class Menu extends AbstractGame<MenuInit, ReturnType<typeof prepare>, {}, MenuEnd> {
  constructor(init: Init, menuInit: MenuInit) {
    super(init, menuInit, true);
    this.start();
  }

  private _buttons: AbstractButton<any, any, any, any>[] = [];
  private _desc = "Слова";

  protected start() {
    drawBackground(this.init.ctx);
    if (this.content.plans instanceof Array) {
      for (const plan of this.content.plans) {
        if (plan.viewer) this._buttons.push(
          new Button(
            this.init, this._desc, 
            this.prepared.pos.xDesc, this.prepared.pos.yDesc(plan.place, this._buttons.length, () => this.scroll.pos), 
            { 
              minWidth: this.prepared.pos.minWidth(), minHeight: this.prepared.pos.minHeight,
              disabled: !this.prepared.progress[plan.place],
              onClick: () => {
                this.stop({ isSuccess: true, game: plan.viewer as Game });
                return false;
              },
            },
          )
        );
        this._buttons.push(
          new ButtonWithDescription(
            this.init, 
            { text: plan.name, description: plan.label }, 
            this.prepared.pos.xGame, this.prepared.pos.yGame(plan.place, this._buttons.length, () => this.scroll.pos), 
            { 
              minWidth: this.prepared.pos.minWidthGame, minHeight: this.prepared.pos.minHeight, 
              disabled: !plan.openedInitialy && !this.prepared.progress[plan.place],
              onClick: () => { 
                this.stop({ isSuccess: true, game: () => {
                  const game = plan.game();
                  game.onGameEnd.push((result) => {
                    if (result?.isSuccess) {
                      plan.openPlace?.forEach((place) => this.prepared.progress[place] = true);
                      saveProgress(this.init, this.prepared.progress);
                    }
                  })
                  return game;
                }});
                return false;
              },
            },
          )
        );
      }
    } else {
      this.redraw();
    }
  }
  protected freeResources(): void {
    for (const btn of this._buttons) btn.stop();
  }
  protected prepare() {
    return prepare(this.init, this.content.plans instanceof Array ? this.content.plans : [], this._desc);
  }
  protected preparePos() {
    return {};
  }
  protected redraw() {
    drawBackground(this.init.ctx);
    if (this.content.plans instanceof Array) {
      for (const btn of this._buttons) btn.redraw();
    } else {
      drawTextAtCenter(this.init.ctx, this.init.ctx.canvas.width / 2, this.init.ctx.canvas.height / 2, this.content.plans);
    }
  }
  protected scrollOptions() {
    return {
      oneStep: this.prepared.pos.minWidth(),
      maxHeight: this.prepared.pos.totalHeight(),
    }
  }
  protected update() {
    for (const btn of this._buttons) btn.dynamicPos();
  }
}

export default Menu;
