
interface UnloadedWord {
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

const loadWord = async (toLoad: UnloadedWord, pxValue: number, side: "width" | "heigth"): Promise<Word> => {
  if (!toLoad.toLearnImgB64) {
    return { toLearnText: toLoad.toLearnText, translation: toLoad.translation };
  } else {
    // promise magic
    return new Promise<Word>((resolve) => {
      const toLearnImg = new Image();
      toLearnImg.onload = () => {
        const scale = (side == "width") ? pxValue / toLearnImg.width : pxValue / toLearnImg.height;
        toLearnImg.width *= scale;
        toLearnImg.height *= scale;
        resolve({ toLearnImg, toLearnText: toLoad.toLearnText, translation: toLoad.translation });
      };
      toLearnImg.src = `data:image/png;base64,${toLoad.toLearnImgB64}`;
    });
  }
};

export type Words<T extends { [key: string]: UnloadedWord }> = { [K in keyof T]: Word };
const loadWords = async <T extends { [key: string]: UnloadedWord }>(toLoad: T, maxWidth: number, side: "width" | "heigth" = "width"): Promise<Words<T>> => {
  // preparation
  const state = {
    names: [] as string[],
    promises: [] as Promise<Word>[],
    loadedWords: [] as Word[],
  }
  Object.entries(toLoad).forEach((entry) => {
    state.names.push(entry[0]);
    state.promises.push(loadWord(entry[1] as UnloadedWord, maxWidth, side));
  });
  state.loadedWords = await Promise.all(state.promises);
  // final
  const result = {};
  for (let i = state.names.length; i >= 0; i--) result[state.names[i]] = state.loadedWords[i];
  return result as Words<T>;
}

export default loadWords;
