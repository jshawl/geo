// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { breadcrumbs, render, type Count } from "./view";
import * as map from "./map";

vi.mock("./map", () => ({
  render: vi.fn(),
  addGeoHashes: vi.fn(),
  updateMapFromUrl: vi.fn(),
  updateUrlFromMap: vi.fn(),
  addEventListener: (_type: string, fn: () => void) => {
    fn();
  },
}));

describe("view", () => {
  describe("breadcrumbs", () => {
    it("makes each part of the date clickable", () => {
      expect(breadcrumbs([])).toBe("<h2><a href='/#/'>~/</a> </h2>");
      expect(breadcrumbs(["2025"])).toBe(
        "<h2><a href='/#/'>~/</a> <a href='/#/2025'>2025</a></h2>"
      );
      expect(breadcrumbs(["2025", "12"])).toBe(
        "<h2><a href='/#/'>~/</a> <a href='/#/2025'>2025</a>-<a href='/#/2025-12'>12</a></h2>"
      );
    });
  });

  describe("render", () => {
    let year: string,
      month: string,
      day: string,
      view: HTMLElement,
      geohash: string;

    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn());
      year = "2025";
      month = "12";
      day = "20";
      view = document.createElement("div");
      geohash = "";
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.clearAllMocks();
    });

    describe("render day", () => {
      it("fetches data and renders the map", async () => {
        const data: map.Event[] = [{ lat: 1.23, lon: 4.56 }];
        vi.mocked(globalThis.fetch).mockResolvedValueOnce(Response.json(data));
        render({ view, year, month, day, geohash });

        expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\?from=2025-12-20(.*)&to=2025-12-21/)
        );
        await vi.waitFor(() => {
          expect(map.render).toHaveBeenCalledOnce();
        });
        expect(map.render).toHaveBeenCalledWith(data);
      });

      it("handles no events", async () => {
        const data: map.Event[] = [];
        vi.mocked(globalThis.fetch).mockResolvedValueOnce(Response.json(data));
        render({ view, year, month, day, geohash });

        expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\?from=2025-12-20(.*)&to=2025-12-21/)
        );
        await vi.waitFor(() => {
          expect(view.innerHTML).toContain("No events found.");
        });
      });
    });

    describe("render month", () => {
      it("fetches data and renders a list of days", async () => {
        const data: Count<"day">[] = [{ day: "2025-12-01", count: "42" }];
        day = "";
        vi.mocked(globalThis.fetch).mockResolvedValueOnce(Response.json(data));
        render({ view, year, month, day, geohash });

        expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/days\?year=2025&month=12/)
        );
        await vi.waitFor(() => {
          expect(view.innerHTML).toContain(
            '<li><a href="/#/2025-12-01">2025-12-01</a> - 42</li>'
          );
        });
        expect(map.render).not.toHaveBeenCalled();
      });
    });

    describe("render year", () => {
      it("fetches data and renders a list of months", async () => {
        const data: Count<"month">[] = [{ month: "2025-12", count: "42" }];
        month = "";
        day = "";
        vi.mocked(globalThis.fetch).mockResolvedValueOnce(Response.json(data));
        render({ view, year, month, day, geohash });

        expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/months\?year=2025/)
        );
        await vi.waitFor(() => {
          expect(view.innerHTML).toContain(
            '<li><a href="/#/2025-12">2025-12</a> - 42</li>'
          );
        });
        expect(map.render).not.toHaveBeenCalled();
      });
    });

    describe("render years", () => {
      beforeEach(() => {
        const data: Count<"year">[] = [{ year: "2025", count: "42" }];
        month = "";
        day = "";
        year = "";
        vi.mocked(globalThis.fetch).mockResolvedValueOnce(Response.json(data));
        vi.useFakeTimers();
        render({ view, year, month, day, geohash });
      });

      it("fetches data and renders a list of years and the map", async () => {
        expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/years/)
        );
        await vi.waitFor(() => {
          expect(view.innerHTML).toContain(
            '<li><a href="/#/2025">2025</a> - 42</li>'
          );
        });
        expect(map.render).toHaveBeenCalledOnce();
      });

      it("updates geohash markers on map move", async () => {
        await vi.waitFor(() => {
          expect(view.innerHTML).toContain(
            '<li><a href="/#/2025">2025</a> - 42</li>'
          );
        });
        expect(map.addGeoHashes).toHaveBeenCalledOnce();
        // addEventListener move is invoked automatically in mock
        vi.advanceTimersByTime(500);
        expect(map.addGeoHashes).toHaveBeenCalledTimes(2);
      });
    });

    describe("render geohash events", () => {
      beforeEach(() => {
        month = "";
        day = "";
        year = "";
        geohash = "abc";
      });

      it("fetches data and renders a list of events and the map", async () => {
        const data: map.Event[] = [{ lat: 1.23, lon: 4.56 }];
        vi.mocked(globalThis.fetch).mockResolvedValueOnce(Response.json(data));
        render({ view, year, month, day, geohash });

        expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\?geohash=abc/)
        );
        await vi.waitFor(() => {
          expect(map.render).toHaveBeenCalledOnce();
        });
        expect(map.render).toHaveBeenCalledWith(data, { polyline: false });
      });

      it("handles no events", async () => {
        const data: map.Event[] = [];
        vi.mocked(globalThis.fetch).mockResolvedValueOnce(Response.json(data));
        render({ view, year, month, day, geohash });

        expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\?geohash=abc/)
        );
        await vi.waitFor(() => {
          expect(view.innerHTML).toContain("No events found.");
        });
      });
    });
  });
});
