import Nav from "./nav";
import { UnloadedWord } from "./games";
import CTX from "./gui/CTX";
import { loadWords } from "./asset";
import settings from "./settings";

const index = async (ctx: CanvasRenderingContext2D, unloadedWords: UnloadedWord[], isDev?: boolean): Promise<Nav> => {
  const innerCTX = await CTX.aconstructor(ctx);
  const words = await loadWords(unloadedWords, settings.gui.icon.width);
  return new Nav(innerCTX, words);
}

export default index;
