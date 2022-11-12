
export interface EndGameStats {
  isSuccess: boolean
}

export type Game = () => Promise<EndGameStats>;