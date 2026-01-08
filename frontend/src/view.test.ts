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
  whenLoaded: (callback: () => void) => {
    callback();
  },
  setView: vi.fn(),
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
        const data: map.Event[] = [{ id: 1, lat: 1.23, lon: 4.56 }];
        vi.mocked(globalThis.fetch).mockResolvedValueOnce(Response.json(data));
        vi.stubEnv("TZ", "UTC");
        await render({ view, year, month, day, geohash });
        expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
          "/api?from=2025-12-20T00:00:00.000Z&to=2025-12-21T00:00:00.000Z"
        );
        expect(map.render).toHaveBeenCalledTimes(2);
        expect(map.render).toHaveBeenCalledWith(data, { polyline: true });
      });

      it("handles no events", async () => {
        const data: map.Event[] = [];
        vi.mocked(globalThis.fetch).mockResolvedValueOnce(Response.json(data));
        await render({ view, year, month, day, geohash });
        expect(view.innerHTML).toContain("No events found.");
      });
    });

    describe("render month", () => {
      it("fetches data and renders a list of days", async () => {
        const data: Count<"day">[] = [{ day: "2025-12-01", count: "42" }];
        day = "";
        vi.mocked(globalThis.fetch).mockResolvedValueOnce(Response.json(data));
        await render({ view, year, month, day, geohash });

        expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
          "/api/days?year=2025&month=12"
        );
        expect(view.innerHTML).toContain(
          '<li><a href="/#/2025-12-01">2025-12-01</a> - 42</li>'
        );
        expect(map.render).toHaveBeenCalledOnce();
      });
    });

    describe("render year", () => {
      it("fetches data and renders a list of months", async () => {
        const data: Count<"month">[] = [{ month: "2025-12", count: "42" }];
        month = "";
        day = "";
        vi.mocked(globalThis.fetch).mockResolvedValueOnce(Response.json(data));
        await render({ view, year, month, day, geohash });

        expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
          "/api/months?year=2025"
        );
        expect(view.innerHTML).toContain(
          '<li><a href="/#/2025-12">2025-12</a> - 42</li>'
        );
        expect(map.render).toHaveBeenCalledOnce();
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
      });

      it("fetches data and renders a list of years and the map", async () => {
        await render({ view, year, month, day, geohash });
        expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith("/api/years");
        expect(view.innerHTML).toContain(
          '<li><a href="/#/2025">2025</a> - 42</li>'
        );
        expect(map.render).toHaveBeenCalledOnce();
      });

      it("updates geohash markers on map move", async () => {
        await render({ view, year, month, day, geohash });
        expect(view.innerHTML).toContain(
          '<li><a href="/#/2025">2025</a> - 42</li>'
        );
        expect(map.addGeoHashes).toHaveBeenCalledOnce();
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
        const data: map.Event[] = [{ id: 1, lat: 1.23, lon: 4.56 }];
        vi.mocked(globalThis.fetch).mockResolvedValueOnce(Response.json(data));
        await render({ view, year, month, day, geohash });

        expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
          "/api?geohash=abc"
        );
        expect(map.render).toHaveBeenCalledTimes(2);
        expect(map.render).toHaveBeenCalledWith(data, { polyline: false });
      });

      it("handles no events", async () => {
        const data: map.Event[] = [];
        vi.mocked(globalThis.fetch).mockResolvedValueOnce(Response.json(data));
        await render({ view, year, month, day, geohash });

        expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
          "/api?geohash=abc"
        );
        expect(view.innerHTML).toContain("No events found.");
      });
    });
  });
});
