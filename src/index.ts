import Nav from "./nav";
import { UnloadedWord } from "./games";
import CTX from "./gui/CTX";

/**
 * @returns error string or Nav in case everything is okay
 */
const index = async (ctx: CanvasRenderingContext2D, words: UnloadedWord[], isDev?: boolean): Promise<Nav> => {
  const innerCTX = await CTX.aconstructor(ctx);
  return new Nav(innerCTX, words);
}

export default index;
