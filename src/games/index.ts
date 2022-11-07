import { InitSettings } from "..";
import drop from "./drop/game";
import form from "./form/game";
import memory from "./memory/game";


export interface EndGameStats {
  isSuccess: boolean
}

export type GamePlanItem = Array<any>;

export type GamePlanError = string;

export type GamePlanItemChecker = (plan: GamePlanItem) => true | GamePlanError;

export type Game = (is: InitSettings, plan: GamePlanItem) => GamePlanError | Promise<EndGameStats>;

export const games: { [key: string]: Game } = {
  drop,
  form,
  memory,
}