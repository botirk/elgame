import { Init } from "./init";

interface Progress {
  [number: number]: boolean
}

const isKeyNum = (key: string) => key.toString().match(/^\d+$/);

export const loadProgress = (init: Init): Progress => {
  if (init.isDev) {
    return new Proxy<Progress>({}, {
      get: function () {
        return true;
      },
      set: function (target, key, value, receiver) {
        if (typeof(value) == "boolean" && isKeyNum(key.toString())) Reflect.set(target, key, value, receiver);
        return true;
      },
    })
  } else {
    const saveJSON = localStorage.getItem("elgame");
    if (saveJSON) {
      const parsed = JSON.parse(saveJSON);
      if (typeof(parsed) == "object") {
        if (!Object.keys(parsed).some((key) => !isKeyNum(key))) {
          return parsed;
        }
      }
    }
    return { [1]: true };
  }
}

export const saveProgress = (init: Init, progress: Progress): boolean => {
  const saveJSON = JSON.stringify(progress);
  try {
    localStorage.setItem("elgame", saveJSON);
    return true;
  } catch {
    try {
      localStorage.removeItem("elgame");
      localStorage.setItem("elgame", saveJSON);
      return true;
    } catch {
      return false;
    }
  }
}