import { Init } from "../init";
import settings from "../settings";
import AbstractButton from "./abstractButton";

interface ButtonGroupOptional1 {
    prevButtons: AbstractButton<any, any, any, any> | ButtonGroup;
    prevButtonsDist?: number;
}

interface ButtonGroupOptional2 {
    x: number;
    y: number;
}

type Direction = "row" | "column" | "grid";

type ButtonGroupOptional = ButtonGroupOptional1 | ButtonGroupOptional2;

class ButtonGroup {
    constructor(init: Init, buttons: AbstractButton<any, any, any, any>[], direction: Direction, optional: ButtonGroupOptional, gap = settings.gui.button.distance) {
        this._init = init;
        this._buttons = buttons;
        this._direction = direction;
        this._optional = optional;
        this._gap = gap;
        this.repos();
    }

    private _init: Init;
    private _buttons: AbstractButton<any, any, any, any>[];
    private _direction: Direction;
    private _gap: number;
    private _optional: ButtonGroupOptional;

    private equalize() {
        let width = 0, height = 0;
        for (const btn of this._buttons) {
            width = Math.max(width, btn.width);
            height = Math.max(height, btn.height);
        }
        for (const btn of this._buttons) {
            btn.minWidth = width;
            btn.minHeight = height;
        } 
        return { width, height };
    }
    private calcDir(buttons: AbstractButton<any, any, any, any>[], dir: "width" | "height", includeStartEnd: boolean) {
        let result = 0;
        for (let i = 0; i < buttons.length; i++) {
            result += buttons[i][dir];
            if (i + 1 < buttons.length) result += this._gap; 
        }
        if (includeStartEnd) result += this._gap * 2;
        return result;
    }
    private place2grid(x: number, y: number) {
        const size = this.equalize();
        let columns = this._buttons.length;
        let lastRowColumns = columns;
        let rows = 1;
        let rowWidth = this.calcDir(this._buttons, "width", false);
        // reduce amount of columns
        while ((rowWidth + this._gap > this._init.ctx.canvas.width || columns > rows + 1) && columns > 1) {
            // count amount moved down
            let gettingReduced = rows - 1;
            if (columns === lastRowColumns) gettingReduced += 1;
            // reduce columns
            if (columns === lastRowColumns) lastRowColumns -= 1;
            columns -= 1;
            // move them to lastRowColumns
            if (columns > lastRowColumns) {
                const toLastRowColumns = Math.min(gettingReduced, columns - lastRowColumns);
                lastRowColumns += toLastRowColumns;
                gettingReduced -= toLastRowColumns;
            }
            // move them to new row
            if (gettingReduced > 0) {
                rows += 1;
                lastRowColumns = gettingReduced;
            }
            // recalc
            rowWidth = this.calcDir(this._buttons.slice(0, columns), "width", false);
        }
        // calc column width
        const columnHeight = this.calcDir(this._buttons.slice(0, rows), "height", false);
        // calc start
        let startX = x - rowWidth / 2;
        if (startX < this._gap) startX = this._gap;
        let startY = y - columnHeight / 2;
        if (startY < this._gap) startY = this._gap;
        // place
        for (let row = 1; row <= rows; row++) {
            for (let column = 1; column <= columns && (row !== rows || row <= lastRowColumns); column++) {
                const nbtn = row * (column - 1);
                const btn = this._buttons[nbtn];
                btn.x = startX + (column - 1) * (size.width + this._gap);
                btn.y = startY + (row - 1) * (size.height + this._gap);
            }
        }
    }
    public repos() {
        const optional = this._optional as any;
        if (this._direction === "grid" && optional.x) {
            this.place2grid(optional.x, optional.y);
        }
    }
    public stop() {
        for (const btn of this._buttons) btn.stop();
    }
    public redraw() {
        for (const btn of this._buttons) btn.redraw();
    }
}

export default ButtonGroup;
