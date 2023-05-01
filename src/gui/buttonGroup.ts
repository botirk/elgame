import { Init } from "../init";
import settings from "../settings";
import { ButtonLike } from "./abstractButton";

const calcDir = (buttons: ButtonLike<any>[], dir: "width" | "height", includeStartEnd: boolean, gap: number) => {
    let result = 0;
    for (let i = 0; i < buttons.length; i++) {
        if (i > 0) result += gap;
        result += buttons[i][dir];
    }
    if (includeStartEnd) result += gap * 2;
    return result;
}

export class ButtonGroupGrid<TBLike extends ButtonLike<any>[]> extends ButtonLike<TBLike> {
    private _itemWidth: number;
    get itemWidth() { return this._itemWidth; }
    private _itemHeight: number;
    get itemHeight() { return this._itemHeight; }

    xy(x: number | (() => number), y: number | (() => number)) {
        if (typeof(x) === "function") {
            this._dynamicX = x;
            x = x();
        }
        if (typeof(y) === "function") {
            this._dynamicY = y;
            y = y();
        }
        let changed = false;
        if (this._x !== x) {
            changed = true;
            this._x = x; 
        }
        if (this._y !== y) {
            changed = true;
            this._y = y; 
        }
        if (changed) this.place(); 
    }

    private _innerHeight: number;
    get innerHeight() { return this._innerHeight; }

    private _innerWidth: number;
    get innerWidth() { return this._innerWidth; }

    get minHeight() { return this._minHeight; }
    set minHeight(minHeight: number) {
        this._minHeight = minHeight; 
    }

    get minWidth() { return this._minWidth; }
    set minWidth(minWidth: number) { this._minWidth = minWidth; }

    constructor(private _init: Init, content: TBLike, _x: number | (() => number), _y: number | (() => number)) {
        super();
        this._content = content;
        this.equalize();
        this.xy(_x, _y);
        
    }
    private equalize() {
        this._itemWidth = 0;
        this._itemHeight = 0;
        for (const btn of this.content) {
            this._itemWidth = Math.max(this._itemWidth, btn.width);
            this._itemHeight = Math.max(this._itemHeight, btn.height);
        }
        for (const btn of this.content) {
            btn.minWidth = this._itemWidth;
            btn.minHeight = this._itemHeight;
        }
    }
    private calc() {
        let columns = this.content.length;
        let lastRowColumns = columns;
        let rows = 1;
        let rowWidth = calcDir(this.content, "width", false, settings.gui.button.padding);
        // reduce amount of columns
        while ((rowWidth + settings.gui.button.padding > this._init.ctx.canvas.width || columns > rows + 1) && columns > 1) {
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
            rowWidth = calcDir(this.content.slice(0, columns), "width", false, settings.gui.button.padding);
        }
        // calc column width
        const columnHeight = calcDir(this.content.slice(0, rows), "height", false, settings.gui.button.padding);
        // save content size
        this._innerWidth = rowWidth;
        this._innerHeight = columnHeight;
        // save total size
        this._width = Math.max(this.innerWidth, this._minWidth);
        this._height = Math.max(this.innerHeight, this._minHeight);
        // save start / end
        this._startX = this._x - this._width / 2;
        this._startY = this._y - this._height / 2;
        this._endX = this._startX + this.width;
        this._endY = this._startY + this.height;

        return { columns, rows, lastRowColumns, rowWidth, columnHeight };
    }
    private place() {
        const calced = this.calc();
        // calc real starts
        const realStartX = Math.max(this._startX, this._x - this.innerWidth / 2) + this._itemWidth / 2;
        const realStartY = Math.max(this._startY, this._y - this.innerHeight / 2) + this._itemHeight / 2;
        // place
        let i = 0;
        for (let row = 1; row <= calced.rows; row++) {
            for (let column = 1; column <= calced.columns && (row !== calced.rows || column <= calced.lastRowColumns); column++) {
                this.content[i++].xy(
                    realStartX + (column - 1) * (this._itemWidth + settings.gui.button.padding), 
                    realStartY + (row - 1) * (this._itemHeight + settings.gui.button.padding)
                );
            }
        }
    }
    redraw() {
        for (const btn of this.content) btn.redraw();
    }
    stop() {
        for (const btn of this.content) btn.stop();
    }
}

export type TableItem = (ButtonLike<any> | undefined);
export type Table = TableItem[][];

export class ButtonGroupTable extends ButtonLike<Table> {
    private _itemWidthPerColumn: number[];
    private _itemHeight: number;
    get itemHeight() { return this._itemHeight; }

    public scroll: number = 0;

    get minHeight() { return this._minHeight; }
    set minHeight(minHeight: number) { this._minHeight = minHeight; }

    get minWidth() { return this._minWidth; }
    set minWidth(minWidth: number) { this._minWidth = minWidth; }

    private _innerHeight: number;
    get innerHeight() { return this._innerHeight; }
    private calcInnerHeight(t: Table) {
        let height = 0
        const rows = t.length;
        for (let i = 0; i < rows; i++) {
            if (i > 0) height += settings.gui.button.padding;
            height += this._itemHeight;
        }
        this._innerHeight = height;
    }

    private _innerWidth: number;
    get innerWidth() { return this._innerWidth; }
    private calcInnerWidth(t: Table) {
        let width = 0;
        const columns = t.reduce((prev, cur) => Math.max(prev, cur.length), 0);
        for (let i = 0; i < columns; i++) {
            if (i > 0) width += settings.gui.button.padding;
            width += (this._itemWidthPerColumn[i] || 0);
        }
        this._innerWidth = width;
    }

    constructor(
        private _init: Init, content: Table, 
        _x: number | (() => number), _y: number | (() => number), 
        readonly limitRect?: { startX: number, startY: number }) 
    {
        super();
        this._content = content;
        this.equalize();
        this.xy(_x, _y);
    }
    
    xy(x: number | (() => number), y: number | (() => number)) {
        if (typeof(x) === "function") {
            this._dynamicX = x;
            x = x();
        }
        if (typeof(y) === "function") {
            this._dynamicY = y;
            y = y();
        }
        let changed = false;
        if (this._x !== x) {
            changed = true;
            this._x = x; 
        }
        if (this._y !== y) {
            changed = true;
            this._y = y; 
        }
        if (changed) this.resize(); 
    }
    
    private calcStartEnd() {
        this._startX = this.x - this.width / 2;
        if (this.limitRect?.startX) this._startX = Math.max(this.limitRect.startX - this.scroll, this.startX);
        this._startY = Math.max(0 - this.scroll, this.y - this.height / 2);
        if (this.limitRect?.startY) this._startY = Math.max(this.limitRect.startY - this.scroll, this.startY);
        this._endX = this._startX + this.width;
        this._endY = this._startY + this.height;
    }
    private calcDisplayItemX(column: number) {
        let x = this.startX;
        let prevWidth = 0;
        for (let i = 0; i <= column; i++) {
            const curWidth = (this._itemWidthPerColumn[i] || 0);
            if (i > 0) x += settings.gui.button.padding;
            x += prevWidth / 2 + curWidth / 2;
            prevWidth = curWidth;
        }
        return x;
    }
    private calcDisplayItemY(row: number) {
        let y = this.startY - this.scroll;
        let prevHeight = 0;
        for (let i = 0; i <= row; i++) {
            const curHeight = this._itemHeight;
            if (i > 0) y += settings.gui.button.padding;
            y += prevHeight / 2 + this._itemHeight / 2;
            prevHeight = curHeight;
        }
        return y;
    }
    private doesItemOverflows(column: number) {
        let width = 0;
        for (let i = 0; i <= column; i++) {
            if (i > 0) width += settings.gui.button.padding;
            width += (this._itemWidthPerColumn[i] || 0);
            if (this.x + width / 2 > this._init.ctx.canvas.width) return true;
        }
        return false;
    }
    private equalize() {
        this._itemWidthPerColumn = [];
        this._itemHeight = 0;

        for (const row of this.content) {
            for (let column = 0; column < row.length; column += 1) {
                this._itemWidthPerColumn[column] = Math.max(this._itemWidthPerColumn[column] || 0, row[column]?.innerWidth || 0);
                this._itemHeight = Math.max(this._itemHeight, row[column]?.innerHeight || 0);
            }
        }
        for (const row of this.content) {
            for (let column = 0; column < row.length; column++) {
                if (row[column] === undefined) continue;
                (row[column] as ButtonLike<any>).minWidth = (this._itemWidthPerColumn[column] || 0);
                (row[column] as ButtonLike<any>).minHeight = this._itemHeight;
            }
        }
    }
    private calc() {
        const t: Table = [];
        // calc display content
        for (let row = 0; row < this.content.length; row++) {
            let displayColumn = 0;
            let pushToEnd = false;
            let displayRowResult: TableItem[] = [];
            for (let column = 0; column < this.content[row].length; column++) {
                const cur = this.content[row][column];
                if (!pushToEnd) {
                    // empty push OR empty row OR it fits screen
                    if (!cur || !displayRowResult.some((item) => item) || !this.doesItemOverflows(displayColumn)) {
                        displayRowResult.push(cur);
                        displayColumn += 1;
                    // does not fit on screen
                    } else {
                        t.push(displayRowResult);
                        displayRowResult = [];
                        // push it to end in next iteration on the column bellow last one
                        pushToEnd = true;
                        column -= 1;
                    }
                } else {
                    // shift
                    if (!displayRowResult[0]) {
                        displayRowResult.shift();
                        displayRowResult[displayColumn] = cur;
                    // no more to shift
                    } else {
                        t.push(displayRowResult);
                        displayRowResult = [];
                    }
                }
            }
            t.push(displayRowResult);
        }
        // inner size
        this.calcInnerWidth(t);
        this.calcInnerHeight(t);
        // save total size
        this._width = Math.max(this.innerWidth, this._minWidth);
        this._height = Math.max(this.innerHeight, this._minHeight);
        // start / end
        this.calcStartEnd();
        
        return t;
    }
    private place(t: Table) {
        for (let row = 0; row < t.length; row++) {
            for (let column = 0; column < t[row].length; column++) {
                const cur = t[row][column];
                if (!cur) continue;
                cur.x = () => this.calcDisplayItemX(column);
                cur.y = () => this.calcDisplayItemY(row);
            }
        }
    }
    resize() {
        this.place(this.calc());
    }
    innerResize() {
        this.equalize();
        this.resize();
    }
    redraw() {
        for (const row of this.content) {
            for (const btn of row) {
                btn?.redraw();
            }
        }
    }
    stop() {
        for (const row of this.content) {
            for (const btn of row) {
                btn?.stop();
            }
        }
    }
    dynamic() {
        super.dynamic();
        for (const row of this.content) {
            for (const btn of row) {
                btn?.dynamic();
            }
        }
    }
}
