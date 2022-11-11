import { InitSettings } from "..";
import drop, { DropPlan } from "./drop/game";
import form, { FormPlan } from "./form/game";
import memory, { MemoryPlan } from "./memory/game";

export interface EndGameStats {
  isSuccess: boolean
}

export type GamePlan = DropPlan | FormPlan | MemoryPlan;

export type GamePlanError = string;

export type GamePlanItemChecker = (plan: GamePlan) => true | GamePlanError;

export type Game = (is: InitSettings, plan: GamePlan) => GamePlanError | Promise<EndGameStats>;

export const games = {
  drop,
  memory,
  form,
}