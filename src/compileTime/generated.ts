
interface UnloadedImg { imgB64: string, name: string };
export interface LoadedImg { img: HTMLImageElement, name: string };

async function loadImg(toLoad: UnloadedImg, pxValue: number, side: "width" | "heigth") {
  // promise magic
  return new Promise<LoadedImg>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = (side == "width") ? pxValue / img.width : pxValue / img.height;
      img.width *= scale;
      img.height *= scale;
      resolve({ img, name: toLoad.name });
    };
    img.src = `data:image/png;base64,${toLoad.imgB64}`;
  });

};

export type TransformedImgsJSON<T extends { [key: string]: UnloadedImg }> = { [K in keyof T]: LoadedImg };
export async function loadImgs(toLoad: UnloadedImg[], maxWidth: number, side: "width" | "heigth"): Promise<LoadedImg[]>;
export async function loadImgs<T extends { [key: string]: UnloadedImg }>(toLoad: T, maxWidth: number, side: "width" | "heigth"): Promise<TransformedImgsJSON<T>>;
export async function loadImgs(toLoad: any, maxWidth: number, side: "width" | "heigth" = "width") {
  if (toLoad instanceof Array) {
    return await Promise.all(toLoad.map((toLoad) => loadImg(toLoad, maxWidth, side)));
  } else {
    // preparation
    const state = {
      names: [] as string[],
      promises: [] as Promise<LoadedImg>[],
      loadedImgs: [] as LoadedImg[],
    }
    Object.entries(toLoad).forEach((entry) => {
      state.names.push(entry[0]);
      state.promises.push(loadImg(entry[1] as UnloadedImg, maxWidth, side));
    });
    state.loadedImgs = await Promise.all(state.promises);
    // final
    const result = {};
    for (let i = state.names.length; i >= 0; i--) result[state.names[i]] = state.loadedImgs[i];
    return result;
  }
}

export const randomLoadedImg = (words: LoadedImg[]) => words[Math.floor(Math.random() * words.length)];
