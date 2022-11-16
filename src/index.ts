import drawMenu from "./gui/menu";
import init from "./init";

/**
 * @returns error string or undefined in case everything is okay
 */
const index = async (elementId: string): Promise<string | undefined> => {
  const inited = await init(elementId);
  if (typeof(inited) == "string") return inited;
  drawMenu(inited);
}

export default index;
