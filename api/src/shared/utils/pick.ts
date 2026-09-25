export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> =>
  keys.reduce(
    (finalObj, key) => {
      if (obj && obj[key] !== undefined) {
        finalObj[key] = obj[key];
      }
      return finalObj;
    },
    {} as Pick<T, K>,
  );
