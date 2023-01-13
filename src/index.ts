import Nav from "./nav";
import init from "./init";

/**
 * @returns error string or undefined in case everything is okay
 */
const index = async (elementId: string, isDev?: boolean): Promise<string | Nav> => {
  const inited = await init(elementId, isDev);
  if (typeof(inited) == "string") return inited;
  return new Nav(inited);
}

export default index;
