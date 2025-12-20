// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { breadcrumbs, render } from "./view";
import * as map from "./map";
vi.mock("./map");
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
    });
  });
});
