
const isObject = (item) => {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

export type RecursivePartial<T> = { [P in keyof T]?: RecursivePartial<T[P]>; };

export const mergeDeep = <T extends Object>(target: T, ...sources): T => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}