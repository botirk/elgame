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

type Direction = "row" | "column";

type ButtonGroupOptional = ButtonGroupOptional1 | ButtonGroupOptional2;

interface DirParams {
    width: number,
    height: number,
    pairs: {
        button: AbstractButton<any, any, any, any>;
        pos: {
            x: number;
            y: number;
        }
    }[]
}

class ButtonGroup {
    constructor(init: Init, buttons: AbstractButton<any, any, any, any>[], direction: Direction, optional: ButtonGroupOptional, gap = settings.gui.button.distance) {
        this._init = init;
        this._buttons = buttons;
        this._direction = direction;
        this._optional = optional;
        this._gap = gap;
    }

    private _init: Init;
    private _buttons: AbstractButton<any, any, any, any>[];
    private _direction: Direction;
    private _gap: number;
    private _optional: ButtonGroupOptional;

    private place1(optional: ButtonGroupOptional1) {

    }
    private place2(optional: ButtonGroupOptional2) {
        const params: DirParams[] = [{ width: 0, height: 0, pairs: [] }];

        for (const btn of this._buttons) {
            const lastParam = params[params.length - 1];
        }
    }
}

export default ButtonGroup;
