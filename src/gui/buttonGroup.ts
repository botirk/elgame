import settings from "../settings";
import CTX from "./CTX";
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
    constructor(ctx: CTX) {
        super(ctx);
    }

    protected init(content: TBLike) {
        this.equalize();
        this.place();
    }
    
    private _itemWidth: number;
    get itemWidth() { return this._itemWidth; }
    private _itemHeight: number;
    get itemHeight() { return this._itemHeight; }

    private _innerHeight: number;
    get innerHeight() { return this._innerHeight; }

    private _innerWidth: number;
    get innerWidth() { return this._innerWidth; }

    private equalize() {
        this._itemWidth = 0;
        this._itemHeight = 0;
        if (this.content === undefined) return;
        for (const btn of this.content) {
            this._itemWidth = Math.max(this._itemWidth, btn.width);
            this._itemHeight = Math.max(this._itemHeight, btn.height);
        }
        for (const btn of this.content) {
            btn.minWidth = () => this._itemWidth;
            btn.minHeight = () => this._itemHeight;
        }
    }
    private calc() {
        const content = (this.content || []);
        let columns = content.length;
        let lastRowColumns = columns;
        let rows = 1;
        let rowWidth = calcDir(content, "width", false, settings.gui.button.padding);
        // reduce amount of columns
        while ((rowWidth + settings.gui.button.padding > this.ctx.ctx.canvas.width || columns > rows + 1) && columns > 1) {
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
            rowWidth = calcDir(content.slice(0, columns), "width", false, settings.gui.button.padding);
        }
        // calc column width
        const columnHeight = calcDir(content.slice(0, rows), "height", false, settings.gui.button.padding);
        // save content size
        this._innerWidth = rowWidth;
        this._innerHeight = columnHeight;
        // save total size
        this.width = Math.max(this.innerWidth, this.minWidth);
        this.height = Math.max(this.innerHeight, this.minHeight);
        // save start / end
        this._startX = this.x - this.width / 2;
        this._startY = this.y - this.height / 2;
        this._endX = this._startX + this.width;
        this._endY = this._startY + this.height;

        return { columns, rows, lastRowColumns, rowWidth, columnHeight };
    }
    private place() {
        const content = (this.content || [])
        const calced = this.calc();
        // calc real starts
        const realStartX = Math.max(this._startX, this.x - this.innerWidth / 2) + this._itemWidth / 2;
        const realStartY = Math.max(this._startY, this.y - this.innerHeight / 2) + this._itemHeight / 2;
        // place
        let i = 0;
        for (let row = 1; row <= calced.rows; row++) {
            for (let column = 1; column <= calced.columns && (row !== calced.rows || column <= calced.lastRowColumns); column++) {
                content[i++].xy(
                    realStartX + (column - 1) * (this._itemWidth + settings.gui.button.padding), 
                    realStartY + (row - 1) * (this._itemHeight + settings.gui.button.padding)
                );
            }
        }
    }
    redraw() {
        for (const btn of (this.content || [])) btn.redraw();
    }
    stop() {
        for (const btn of (this.content || [])) btn.stop();
    }
    dynamic(): void {
        super.dynamic();
        this.place();
    }
}

export type TableItem = (ButtonLike<any> | undefined);
export type Table = TableItem[][];

interface LimitRect {
    startX: number,
    startY: number,
}

export class ButtonGroupTable extends ButtonLike<Table> {
    constructor(ctx: CTX) {
        super(ctx);
    }

    protected newContent(): void {
        this.equalize();
        this.place();
    }

    private _padding = settings.gui.button.padding;
    set padding(padding: number) {
        this._padding = padding;
        this.place();
    }
    get padding() {
        return this._padding;
    }

    private _equalizeAllHeight: boolean = false;
    get equalizeAllHeight() {
        return this._equalizeAllHeight;
    }
    set equalizeAllHeight(value: boolean) {
        if (this._equalizeAllHeight === value) return;
        this._equalizeAllHeight = value;
        this.equalize();
        this.place();
    }

    private _limitRect?: LimitRect;
    get limitRect() { return this._limitRect; }
    set limitRect(limitRect: LimitRect | undefined) {
        this._limitRect = limitRect;
        this.place();
    }

    private _itemWidthPerColumn: number[];
    private _itemHeightPerRow: number[];
    get itemHeight() { return this._itemHeightPerRow; }

    private _innerHeight: number;
    get innerHeight() { return this._innerHeight; }
    private calcInnerHeight(t: Table) {
        let height = 0
        const rows = t.length;
        for (let row = 0; row < rows; row++) {
            if (row > 0) height += this.padding;
            height += (this._itemHeightPerRow[row] || 0);
        }
        this._innerHeight = height;
    }

    private _innerWidth: number;
    get innerWidth() { return this._innerWidth; }
    private calcInnerWidth(t: Table) {
        let width = 0;
        const columns = t.reduce((prev, cur) => Math.max(prev, cur.length), 0);
        for (let i = 0; i < columns; i++) {
            if (i > 0) width += this.padding;
            width += (this._itemWidthPerColumn[i] || 0);
        }
        this._innerWidth = width;
    }
    
    private calcStartEnd() {
        this._startX = this.x - this.width / 2;
        if (this?._limitRect?.startX) this._startX = Math.max(this._limitRect.startX, this.startX);
        
        this._startY = Math.max(0 - this.ctx.scrollEvent.pos, this.y - this.height / 2);
        if (this?._limitRect?.startY) this._startY = Math.max(this._limitRect.startY - this.ctx.scrollEvent.pos, this.startY);
        this._endX = this._startX + this.width;
        this._endY = this._startY + this.height;
    }
    private calcDisplayItemX(column: number) {
        let x = this.startX;
        if (this.width > this.innerWidth) x += (this.width - this.innerWidth) / 2;
        let prevWidth = 0;
        for (let i = 0; i <= column; i++) {
            const curWidth = (this._itemWidthPerColumn[i] || 0);
            if (curWidth === 0) continue;
            if (prevWidth > 0) x += this.padding;
            x += prevWidth / 2 + curWidth / 2;
            prevWidth = curWidth;
        }
        return x;
    }
    private calcDisplayItemY(calcRow: number) {
        let y = this.startY;
        let prevHeight = 0;
        for (let row = 0; row <= calcRow; row++) {
            const curHeight = (this._itemHeightPerRow[row] || 0);
            if (row > 0) y += this.padding;
            y += prevHeight / 2 + (this._itemHeightPerRow[row] || 0) / 2;
            prevHeight = curHeight;
        }
        return y;
    }
    private doesItemOverflows(column: number) {
        /*let width = 0;
        for (let i = 0; i <= column; i++) {
            if (i > 0) width += this.padding;
            width += (this._itemWidthPerColumn[i] || 0);
            if (this.x + width / 2 > this.ctx.ctx.canvas.width) return true;
        }
        return false;*/
        return this.calcDisplayItemX(column) + (this._itemWidthPerColumn[column] || 0) / 2 > this.ctx.ctx.canvas.width;
    }
    private equalize() {
        const content = (this.content || []);
        this._itemWidthPerColumn = [];
        this._itemHeightPerRow = [];
        let maxRowHeight = 0;

        for (let row = 0; row < content.length; row += 1) {
            for (let column = 0; column < content[row].length; column += 1) {
                this._itemWidthPerColumn[column] = Math.max(this._itemWidthPerColumn[column] || 0, content[row][column]?.innerWidth || 0);
                this._itemHeightPerRow[row] = Math.max(this._itemHeightPerRow[row] || 0, content[row][column]?.innerHeight || 0);
            }
            maxRowHeight = Math.max(maxRowHeight, (this._itemHeightPerRow[row] || 0));
        }
        if (this.equalizeAllHeight === true) {
            for (let row = 0; row < this._itemHeightPerRow.length; row += 1) {
                this._itemHeightPerRow[row] = maxRowHeight;
            }
        }
        for (let row = 0; row < content.length; row += 1) {
            for (let column = 0; column < content[row].length; column++) {
                const item = content[row][column];
                if (item === undefined) continue;
                item.minWidth = (this._itemWidthPerColumn[column] || 0);
                item.minHeight = (this._itemHeightPerRow[row] || 0);
            }
        }
    }
    private calc() {
        const content = (this.content || []);
        const t: Table = [];
        // calc display content
        for (let row = 0; row < content.length; row++) {
            let displayColumn = 0;
            let pushToEnd = false;
            let displayRowResult: TableItem[] = [];
            for (let column = 0; column < content[row].length; column++) {
                const cur = content[row][column];
                if (!pushToEnd) {
                    if (this.content?.length === 1 && this.content[0].length === 2 && this.doesItemOverflows(displayColumn)) debugger;
                    // empty push OR empty row OR it fits screen
                    if (!cur || !displayRowResult.some((item) => item) || !this.doesItemOverflows(displayColumn)) {
                        displayRowResult.push(cur);
                        displayColumn += 1;
                    // does not fit on screen
                    } else {
                        // if (this.content?.length === 1 && this.content[0].length === 2) debugger;
                        t.push(displayRowResult);
                        displayRowResult = [];
                        // push it to end in next iteration on the column bellow last one
                        pushToEnd = true;
                        column -= 1;
                        // if (this.content?.length === 1 && this.content[0].length === 2) debugger;
                    }
                } else {
                    // is first element empty?
                    if (!displayRowResult[0]) {
                        displayRowResult.shift();
                        displayRowResult[displayColumn - 1] = cur;
                    // can't shift no more
                    } else {
                        t.push(displayRowResult);
                        displayRowResult = [];
                    }
                }
            }
            t.push(displayRowResult);
            // if (this.content?.length === 1 && this.content[0].length === 2) debugger;
        }
        // inner size
        this.calcInnerWidth(t);
        this.calcInnerHeight(t);
        // save total size
        this.width = Math.max(this.innerWidth, this.minWidth);
        this.height = Math.max(this.innerHeight, this.minHeight);
        // start / end
        this.calcStartEnd();
        
        // if (this.content?.length === 1 && this.content[0].length === 2) debugger;
        return t;
    }
    private place() {
        const t = this.calc();
        for (let row = 0; row < t.length; row++) {
            for (let column = 0; column < t[row].length; column++) {
                const cur = t[row][column];
                if (!cur) continue;
                cur.xy(this.calcDisplayItemX(column), this.calcDisplayItemY(row));
            }
        }
    }
    protected newPos(x: any, y: any): void {
        this.place();
    }
    innerResize() {
        this.equalize();
        this.place();
    }
    redraw() {
        for (const row of (this.content || [])) {
            for (const btn of row) {
                btn?.redraw();
            }
        }
    }
    stop() {
        for (const row of (this.content || [])) {
            for (const btn of row) {
                btn?.stop();
            }
        }
    }
    dynamic(): void {
        super.dynamic();
        this.place();
    }
}
