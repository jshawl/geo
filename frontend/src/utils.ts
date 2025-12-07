let debounceTimeout: number;
export const debounce = (fn: Function) => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(fn, 500);
};
