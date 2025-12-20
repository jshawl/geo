let debounceTimeout: number;
export const debounce = (fn: () => void) => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(fn, 500);
};
