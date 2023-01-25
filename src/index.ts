import Nav from "./nav";
import init from "./init";
import { UnloadedWord } from "./games";

/**
 * @returns error string or Nav in case everything is okay
 */
const index = async (elementId: string, words: UnloadedWord[], isDev?: boolean): Promise<string | Nav> => {
  const inited = await init(elementId, isDev);
  if (typeof(inited) == "string") return inited;
  return new Nav(inited, words);
}

export default index;
