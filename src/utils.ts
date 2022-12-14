
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

export const promiseMagic = <T>(onResolve: (value: T) => void): [Promise<T>, (value: T) => void] => {
  let promiseResolve: (value: T) => void;
  const promise = new Promise<T>((resolve) => promiseResolve = (value: T) => {
    onResolve(value);
    resolve(value);
  });
  return [promise, (value: T) => promiseResolve(value)];
}

export const randomInArray = <T>(a: Array<T>) => {
  return a[Math.floor(Math.random() * a.length)];
}

export const randomiseArray = <T>(a: Array<T>) => randomNInArray(a, a.length);

export const randomNInArray = <T>(a: Array<T>, n: number) => {
  const avail = a.map((_,i) => i);

  const result: Array<T> = [];
  for (let i = 0; i < n && avail.length > 0; i += 1) {
    result.push(a[removeRandomInArray(avail)]);
  }
  return result;
}

export const removeRandomInArray = <T>(a: Array<T>) => {
  return a.splice(Math.floor(Math.random() * a.length), 1)[0];
}