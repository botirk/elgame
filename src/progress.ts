import { loadPlans, Plans } from "./asset"


interface Progress {
  [number: number]: boolean
}

export const loadProgress = (): Progress => {
  return { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true };
}

export const saveProgress = (progress: Progress) => {

}