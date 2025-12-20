import { describe, expect, it, vi } from "vitest";
import { assert, debounce } from "./utils";

describe("utils", () => {
  describe("assert", () => {
    it.each([false, 0, undefined, null, ""])(`throws if falsey`, (value) => {
      expect(() => {
        assert(value);
      }).toThrowError();
    });
    it("does not throw if truthy", () => {
      expect(() => {
        assert(true);
      }).not.toThrowError();
    });
  });

  describe("debounce", () => {
    it("only invokes the callback once", () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      debounce(fn);
      debounce(fn);
      debounce(fn);
      vi.advanceTimersByTime(500);
      expect(fn).toHaveBeenCalledOnce();
    });
  });
});
