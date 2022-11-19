import { DropGameDifficulty, FormGameDifficulty } from "../settings";

export interface EndGameStats {
  isSuccess: boolean
}

export type Game = () => Promise<EndGameStats>;

export interface UnloadedWord {
  toLearnText: string,
  toLearnImgB64?: string,
  translation?: string,
}

export interface Word {
  toLearnText: string,
  toLearnImg?: HTMLImageElement,
  translation?: string,
}

export interface WordWithImage extends Word {
  toLearnImg: HTMLImageElement,
}

export interface WordWithTranslation extends Word {
  translation: string,
}

export interface Plan {
  viewer: {
    place: number,
    openPlace: number[],
    label: string,
    words: string[],
  }[],
  form: {
    place: number,
    openPlace: number[],
    label: string,
    words: string[],
    difficulty: FormGameDifficulty,
  }[],
  memory: {
    place: number,
    openPlace: number[],
    label: string,
    words: string[],
  }[],
  drop: {
    place: number,
    openPlace: number[],
    label: string,
    words: string[],
    difficulty: DropGameDifficulty,
  }[]
}