import { describe, expect, it } from "vitest";
import { prev, next } from "./date";
describe("date", () => {
  describe("prev", () => {
    it("returns the previous dateStr", () => {
      expect(prev("2025")).toBe("2024");
      expect(prev("2025-03")).toBe("2025-02");
      expect(prev("2025-01")).toBe("2024-12");
      expect(prev("2025-03-23")).toBe("2025-03-22");
      expect(prev("2025-03-01")).toBe("2025-02-28");
      expect(prev("2025-01-01")).toBe("2024-12-31");
    });
  });

  describe("next", () => {
    it("returns the next dateStr", () => {
      expect(next("2025")).toBe("2026");
      expect(next("2025-03")).toBe("2025-04");
      expect(next("2025-12")).toBe("2026-01");
      expect(next("2025-03-23")).toBe("2025-03-24");
      expect(next("2025-03-31")).toBe("2025-04-01");
      expect(next("2025-12-31")).toBe("2026-01-01");
    });
  });
});
