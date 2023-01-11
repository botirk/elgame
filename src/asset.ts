import assetsJSON from "./compileTime/generated/assets.json";
import wordsJSON from "./compileTime/generated/words.json";
import planJSON from "./compileTime/generated/plan.json";

import { Game } from "./games";
import Drop from "./games/drop/game";
import Form from "./games/form/game";
import Memory from "./games/memory/game";
import Viewer from "./games/viewer/game";
import { UnloadedWord, Word, WordWithImage } from "./games";
import { Init } from "./init";

const loadAsset = async (b64: string, pxValue: number, side: "width" | "heigth"): Promise<HTMLImageElement> => {
  return new Promise<HTMLImageElement>((resolve) => {
    const asset = new Image();
    asset.onload = () => {
      const scale = (side == "width") ? pxValue / asset.width : pxValue / asset.height;
      asset.width *= scale;
      asset.height *= scale;
      resolve(asset);
    };
    asset.src = `data:image/png;base64,${b64}`;
  });
}

export type Assets = { [K in keyof typeof assetsJSON]: HTMLImageElement };
export const loadAssets = async (maxWidth: number, side: "width" | "heigth" = "width"): Promise<Assets> => {
  const result = {};
  await Promise.all(Object.entries(assetsJSON).map(async (entry) => {
    result[entry[0]] = await loadAsset(entry[1], maxWidth, side);
  }));
  return result as Assets;
}

const loadWord = async (toLoad: UnloadedWord, pxValue: number, side: "width" | "heigth"): Promise<Word> => {
  if (!toLoad.toLearnImgB64) {
    return { toLearnText: toLoad.toLearnText, translation: toLoad.translation };
  } else {
    // promise magic
    return new Promise<Word>((resolve) => {
      loadAsset(toLoad.toLearnImgB64 as string, pxValue, side).then((toLearnImg) => {
        resolve({ toLearnImg, toLearnText: toLoad.toLearnText, translation: toLoad.translation });
      });
    });
  }
};

export type Words = { [K in keyof typeof wordsJSON]: Word };
export const loadWords = async (maxWidth: number, side: "width" | "heigth" = "width"): Promise<Words> => {
  const result = {};
  await Promise.all(Object.entries(wordsJSON).map(async (entry) => {
    result[entry[0]] = await loadWord(entry[1], maxWidth, side);
  }));
  return result as Words;
}

const getWordsWithImage = (init: Init, words: string[]) => {
  const [found, missing] = words.reduce((prev, cur) => {
    if (init.prepared.words[cur] && init.prepared.words[cur]?.toLearnImg) prev[0].push(init.prepared.words[cur]);
    else prev[1].push(cur);
    return prev;
  }, [[], []] as [WordWithImage[], string[]]);
  if (missing.length > 0) return `Words not found in collection: ${missing.join(', ')}`;
  return found;
}

const getWords = (init: Init, words: string[]) => {
  const [found, missing] = words.reduce((prev, cur) => {
    if (init.prepared.words[cur]) prev[0].push(init.prepared.words[cur]);
    else prev[1].push(cur);
    return prev;
  }, [[], []] as [Word[], string[]]);
  if (missing.length > 0) return `Words not found in collection: ${missing.join(', ')}`;
  return found;
}

export interface LoadedPlan { place: number, name: string, label: string, game: Game, viewer?: Game, openPlace?: number[] };
export type LoadedPlans = LoadedPlan[];

export const loadPlans = (init: Init) => {
  const plans: LoadedPlans = [];
  const add = (name: string, { place, label , openPlace }: { place: number, label: string, openPlace?: number[] }, game: Game, viewer?: Game) => {
    plans.push({
      name,
      place,
      openPlace,
      label,
      viewer,
      game,
    });
  }

  for (const plan of planJSON.viewer) {
    const words = getWords(init, plan.words);
    if (typeof(words) == "string") return words;
    add("Viewer", plan, () => new Viewer(init, words).promise);
  }

  for (const plan of planJSON.form) {
    const words = getWordsWithImage(init, plan.words);
    if (typeof(words) == "string") return words;
    add("Form", plan, () => new Form(init, { words, dif: plan.difficulty }).promise, () => new Viewer(init, words).promise);
  }

  for (const plan of planJSON.drop) {
    const words = getWordsWithImage(init, plan.words);
    if (typeof(words) == "string") return words;
    add("Drop", plan, () => new Drop(init, { words, dif: plan.difficulty }).promise, () => new Viewer(init, words).promise);
  }

  for (const plan of planJSON.memory) {
    const words = getWordsWithImage(init, plan.words);
    if (typeof(words) == "string") return words;
    add("Memory", plan, () => new Memory(init, words).promise, () => new Viewer(init, words).promise);
  }

  return plans.sort((a, b) => a.place - b.place);
}
