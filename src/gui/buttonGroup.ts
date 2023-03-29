import { Init } from "../init";
import settings from "../settings";
import AbstractButton, { ButtonLike } from "./abstractButton";

interface ButtonGroupOptional1 {
    prevButtonsDirection: "top";
    prevButtons: AbstractButton<any, any, any, any> | ButtonGroup<AbstractButton<any, any, any, any>>;
    prevButtonsDist?: number;
}

interface ButtonGroupOptional2 {
    x: () => number,
    y: () => number,
    // only non-grid direction
    linkToTop?: boolean,
}

interface ButtonGroupOptional3 {
    minHeight?: number,
    minWidth?: number,
    gap?: number,
}

interface ButtonGroupOptional4 {
    minHeight: number,
    minWidth: number,
    gap: number,
}

type Direction = "row" | "column" | "grid";

type ButtonGroupOptional = ButtonGroupOptional1 | ButtonGroupOptional2;

class ButtonGroup<TButton extends AbstractButton<any, any, any, any>> implements ButtonLike {
    constructor(init: Init, buttons: TButton[], direction: Direction, optional: ButtonGroupOptional, optional2: ButtonGroupOptional3 = {}) {
        this._init = init;
        this.buttons = buttons;
        this._direction = direction;
        this._optional = optional;
        this._optional2 = { gap: optional2.gap || settings.gui.button.distance, minWidth: optional2.minWidth || 0, minHeight: optional2.minHeight || 0 };
        this.repos();
    }

    private _init: Init;
    private _direction: Direction;
    private _optional: ButtonGroupOptional;
    private _optional2: ButtonGroupOptional4;
    buttons: TButton[];

    private _width = 0;
    get width() {
        return this._width;
    }
    private _height = 0;
    get height() {
        return this._height;
    }

    private _startX = 0;
    get startX() {
        return this._startX;
    }
    private _startY = 0;
    get startY() {
        return this._startY;
    }
    private _endX = 0;
    get endX() {
        return this._endX;
    }
    private _endY = 0;
    get endY() {
        return this._endY;
    }

    private equalizeGrid() {
        let width = 0, height = 0;
        for (const btn of this.buttons) {
            width = Math.max(width, btn.width, this._optional2.minWidth);
            height = Math.max(height, btn.height, this._optional2.minHeight);
        }
        for (const btn of this.buttons) {
            btn.minWidth = width;
            btn.minHeight = height;
        } 
        return { width, height };
    }
    private equalizeRow() {
        let height = 0;
        for (const btn of this.buttons) {
            height = Math.max(height, btn.height, this._optional2.minHeight);
        }
        for (const btn of this.buttons) {
            btn.minHeight = height;
        } 
        return { height };
    }
    private calcDir(buttons: AbstractButton<any, any, any, any>[], dir: "width" | "height", includeStartEnd: boolean) {
        let result = 0;
        for (let i = 0; i < buttons.length; i++) {
            result += buttons[i][dir];
            if (i + 1 < buttons.length) result += this._optional2.gap; 
        }
        if (includeStartEnd) result += this._optional2.gap * 2;
        return result;
    }
    private place2grid(x: number, y: number, size: ReturnType<typeof this.equalizeGrid>) {
        let columns = this.buttons.length;
        let lastRowColumns = columns;
        let rows = 1;
        let rowWidth = this.calcDir(this.buttons, "width", false);
        // reduce amount of columns
        while ((rowWidth + this._optional2.gap > this._init.ctx.canvas.width || columns > rows + 1) && columns > 1) {
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
            rowWidth = this.calcDir(this.buttons.slice(0, columns), "width", false);
        }
        // calc column width
        const columnHeight = this.calcDir(this.buttons.slice(0, rows), "height", false);
        // calc start
        let startX = x - rowWidth / 2 + size.width / 2;
        if (startX < this._optional2.gap) startX = this._optional2.gap;
        let startY = y - columnHeight / 2 + size.height / 2;
        if (startY < this._optional2.gap) startY = this._optional2.gap;
        // place
        let i = 0;
        for (let row = 1; row <= rows; row++) {
            for (let column = 1; column <= columns && (row !== rows || column <= lastRowColumns); column++) {
                const btn = this.buttons[i++];
                btn.x = startX + (column - 1) * (size.width + this._optional2.gap);
                btn.y = startY + (row - 1) * (size.height + this._optional2.gap);
            }
        }
        // show size to class user
        this._width = rowWidth;
        this._height = columnHeight;
        this._endY = y + columnHeight / 2;
    }
    private place2row(x: number, y: number, size: ReturnType<typeof this.equalizeRow>) {
        let result = { width: 0, height: size.height, nextY: y, nextX: x, btns: [] as { btn: TButton, newX: number, newY: number }[] };
        let currentRow = { width: 0, height: size.height, btns: [] as { btn: TButton, newX: number, newY: number }[] };
        for (const btn of this.buttons) {
            // calc new width
            const prevWidth = currentRow.width;
            let addedWidth = 0;
            if (currentRow.btns.length > 0) addedWidth += this._optional2.gap;
            addedWidth += btn.width;
            const newWidth = currentRow.width + addedWidth;
            // overflow - new line
            if (prevWidth > 0 && newWidth > this._init.ctx.canvas.width) {
                alert("OVERFLOW!");
            }
            // add width
            else {
                // width
                currentRow.width = newWidth;
                result.width = Math.max(result.width, newWidth);
                // push
                const newX = result.nextX;
                const newY = result.nextY;
                const placedBtn = { newX, newY, btn };
                result.btns.push(placedBtn);
                currentRow.btns.push(placedBtn);
                // repos row
                if (prevWidth > 0) {
                    const reposX = addedWidth / 2;
                    for (const btn of currentRow.btns) btn.newX - reposX;
                }
            }
        }
        // show size to user
        this._width = result.width;
        this._height = result.height;
        this._endY = y - size.height / 2 + result.height;
    }
    repos() {
        const optional = this._optional as any;
        if (this._direction === "grid" && optional.x) {
            this.place2grid(optional.x(), optional.y(), this.equalizeGrid());
        } else if (this._direction === "row" && optional.x) {
            const size = this.equalizeRow();
            if (optional.linkToTop) {
                this.place2row(optional.x(), optional.y() + size.height / 2, size);
            } else {
                this.place2row(optional.x(), optional.y(), size);
            }
        }
    }
    stop() {
        for (const btn of this.buttons) btn.stop();
    }
    redraw() {
        for (const btn of this.buttons) btn.redraw();
    }
    isInArea(x: number, y: number) {
        return x >= this._startX && x <= this._endX && y >= this._startY && y <= this._endY;
    }
}

export default ButtonGroup;
