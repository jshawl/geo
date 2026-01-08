let debounceTimeout: number;
export const debounce = (fn: () => void) => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    fn();
  }, 500);
};

export function assert(condition: unknown): asserts condition {
  if (!condition) {
    throw new Error("Assertion failed");
  }
}
