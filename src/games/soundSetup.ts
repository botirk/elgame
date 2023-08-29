import { AbstractGame, EndGameStats } from ".";
import { ButtonLike } from "../gui/abstractButton";
import { Button } from "../gui/button";
import { ButtonGroupGrid } from "../gui/buttonGroup";
import settings from "../settings";

class SoundSetup extends AbstractGame<{}, {}, {}, EndGameStats> {
    private _grid: ButtonGroupGrid<ButtonLike<any>[]>;
    
    protected start() {
        const mute = new Button(
            this.ctx, this.ctx.assets["volume-mute"], 0, 0, 
            { onClick: () => {
                this.stop({ isSuccess: false });
            }}
        );
        const unmute = new Button(
            this.ctx, this.ctx.assets.volume, 0, 0, 
            { onClick: () => {
                this.stop({ isSuccess: true });
            }}
        );
        this._grid = new ButtonGroupGrid(this.ctx, [mute, unmute], () => this.ctx.centerX(), () => this.ctx.centerY());
    }
    protected prepare() {
        return {};
    }
    protected preparePos() {
        return {};
    }
    protected freeResources() {
        this._grid.stop();
    }
    protected redraw() {
        this.ctx.drawBackground();
        this._grid.redraw();
    }
    protected resize() {
        this._grid.dynamic();
        this._grid.resize();
    }
    protected scrollOptions() {
        return { oneStep: 10, maxHeight: this._grid.height + settings.gui.button.distance * 2 };
    }
}

export default SoundSetup;
