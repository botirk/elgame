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

interface ButtonGroupTableCalc {
    item: TableItem;
    itemWidth: number;
    itemHeight: number;
    prevWidth: number;
    prevHeight: number;
    padding: number;
    isReverseRow: boolean;
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

    private _innerHeight: number;
    get innerHeight() { return this._innerHeight; }
    private _innerWidth: number;
    get innerWidth() { return this._innerWidth; }

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
    private calcStartEnd() {
        this._startX = this.x - this.width / 2;
        if (this?._limitRect?.startX) this._startX = Math.max(this._limitRect.startX, this.startX);
        
        this._startY = Math.max(0 - this.ctx.scrollEvent.pos, this.y - this.height / 2);
        if (this?._limitRect?.startY) this._startY = Math.max(this._limitRect.startY - this.ctx.scrollEvent.pos, this.startY);
        this._endX = this._startX + this.width;
        this._endY = this._startY + this.height;
    }
    private calced: ButtonGroupTableCalc[][];
    private calc()  {
        const content = (this.content || []);
        this.calced = [];
        
        let prevHeight = 0;
        for (let row = 0; row < content.length; row += 1) {
            let rowResult: ButtonGroupTableCalc[] = [];
            let moreRows: ButtonGroupTableCalc[][] = [];
            let prevWidth = 0;
            const equalizedHeight = (this._itemHeightPerRow[row] || 0);
            const paddingY = (equalizedHeight === 0) ? 0 : this.padding;
            for (let column = 0; column < content[row].length; column++) {
                const cur = content[row][column];
                const equalizedWidth = (this._itemWidthPerColumn[column] || 0);
                const paddingX = (equalizedWidth === 0) ? 0 : this.padding;
                const couldBeWidth = prevWidth + equalizedWidth;
                const item: ButtonGroupTableCalc = {
                    item: cur,
                    itemHeight: equalizedHeight,
                    itemWidth: equalizedWidth,
                    prevHeight, 
                    prevWidth,
                    isReverseRow: (moreRows.length > 0),
                    padding: paddingX,
                }
                if (moreRows.length === 0) {
                    // empty item OR empty row OR it fits screen
                    if (!cur || !rowResult.some((item) => item) || couldBeWidth <= this.ctx.ctx.canvas.width) {
                        rowResult.push(item);
                        prevWidth += paddingX + item.itemWidth;
                    // does not fit on screen
                    } else {
                        // create empty row bellow
                        moreRows.push([]);
                        prevHeight += paddingY + equalizedHeight;
                        prevWidth = 0;
                        // continue iterating array, but now put it into moreRows
                        column -= 1;
                    }
                } else {
                    // empty item OR empty row OR it fits screen
                    if (!cur || !moreRows[moreRows.length - 1].some((item) => item) || couldBeWidth <= this.ctx.ctx.canvas.width) {
                        moreRows[moreRows.length - 1].push(item);
                        prevWidth += paddingX + item.itemWidth;
                    // does not fit on screen
                    } else {
                        // create empty row bellow
                        moreRows.push([]);
                        prevHeight += paddingY + equalizedHeight;
                        prevWidth = 0;
                        // continue iterating array
                        column -= 1;
                    }
                }
            }
            this.calced.push(rowResult);
            for (const moreRow of moreRows) this.calced.push(moreRow);
            prevHeight += paddingY + equalizedHeight;
        }
        // calc inner size
        this._innerWidth = 0;
        this._innerHeight = 0;
        for (let row = 0; row < this.calced.length; row += 1) {
            for (let column = 0; column < this.calced[row].length; column += 1) {
                const item = this.calced[row][column];
                this._innerWidth = Math.max(this._innerWidth, item.prevWidth + item.itemWidth);
                this._innerHeight = Math.max(this._innerHeight, item.prevHeight + item.itemHeight);
            }
        }
        // save total size
        this.width = Math.max(this._innerWidth, this.minWidth);
        this.height = Math.max(this._innerHeight, this.minHeight);
        // start / end
        this.calcStartEnd();
    }
    private place() {
        this.calc();
        let startX = this.startX, startY = this.startY, endX = this.endX;
        if (this.width > this.innerWidth) {
            startX += (this.width - this.innerWidth) / 2;
            endX -= (this.width - this.innerWidth) / 2;
        }
        if (this.height > this.innerHeight) startY += (this.height - this.innerHeight) / 2;
        for (let row = 0; row < this.calced.length; row++) {
            for (let column = 0; column < this.calced[row].length; column++) {
                const cur = this.calced[row][column];
                if (!cur.item) continue;
                const x = (!cur.isReverseRow) ? startX + cur.prevWidth + cur.itemWidth / 2 : this.endX - cur.prevWidth - cur.itemWidth / 2;
                const y = startY + cur.prevHeight + cur.itemHeight / 2;
                cur.item.xy(x, y);
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
