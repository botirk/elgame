import Nav from "./nav";
import { UnloadedWord } from "./games";
import CTX from "./gui/CTX";

const index = async (ctx: CanvasRenderingContext2D, words: UnloadedWord[], isDev?: boolean): Promise<Nav> => {
  const innerCTX = await CTX.aconstructor(ctx);
  return new Nav(innerCTX, words);
}

export default index;
