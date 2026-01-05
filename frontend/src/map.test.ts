// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import * as map from "./map";

const mocks = vi.hoisted(() => {
  const map = {
    on: vi.fn(
      (
        _event,
        callbackOrTarget: ((args: unknown) => void) | string,
        callback: (args: unknown) => string
      ) => {
        if (typeof callbackOrTarget === "function") {
          callbackOrTarget({});
        } else {
          callback({});
        }
      }
    ),
    addLayer: vi.fn(),
    addSource: vi.fn(),
    addControl: vi.fn(),
    fitBounds: vi.fn(),
    getBounds: vi.fn(() => ({
      getNorthEast: () => ({}),
      getSouthWest: () => ({}),
    })),
    getCenter: vi.fn(),
    getSource: () => true,
    getStyle: vi.fn<() => { layers: unknown[] }>(() => ({
      layers: [],
      sources: [],
    })),
    getZoom: vi.fn(),
    remove: vi.fn(),
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
    setCenter: vi.fn(),
    setZoom: vi.fn(),
  };

  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class MockMap {
    constructor() {
      Object.assign(this, mocks.map);
    }
  }

  class MockPopup {
    addTo() {
      // pass
    }
    setHTML() {
      return this;
    }
    setLngLat() {
      return this;
    }
  }

  class MockLngLatBounds {
    extend() {
      // pass
    }
  }

  class MockMarker {
    addTo() {
      // pass
    }
    setLngLat() {
      return this;
    }
    setPopup() {
      return this;
    }
  }

  return { MockMap, map, MockPopup, MockLngLatBounds, MockMarker };
});

vi.mock("mapbox-gl", () => ({
  default: {
    Map: mocks.MockMap,
    NavigationControl: vi.fn(),
    LngLatBounds: mocks.MockLngLatBounds,
    Marker: mocks.MockMarker,
    Popup: mocks.MockPopup,
  },
}));

describe("map", () => {
  beforeEach(() => {
    map.destroy();
    map.render([{ lat: 1.23, lon: 4.56 }]);
  });

  describe("render", () => {
    it("adds a polyline", () => {
      expect(mocks.map.addSource).toHaveBeenCalledWith(
        "polyline",
        expect.any(Object)
      );
    });

    it("polyline: false", () => {
      mocks.map.addSource.mockClear();
      map.render(
        [{ lat: 1.23, lon: 4.56, created_at: "2025-12-20", geohash: "abc" }],
        {
          polyline: false,
        }
      );
      expect(mocks.map.addSource).not.toHaveBeenCalled();
    });

    it("handles empty events", () => {
      mocks.map.addSource.mockClear();
      map.render([]);
      expect(mocks.map.addSource).not.toHaveBeenCalled();
    });
  });

  describe("destroy", () => {
    it("supports no map", () => {
      mocks.map.remove.mockClear();
      map.destroy();
      map.destroy();
      expect(mocks.map.remove).toHaveBeenCalledOnce();
    });
  });

  describe("clear", () => {
    it("supports no map", () => {
      mocks.map.removeLayer.mockClear();
      mockEachLayer([]);
      map.destroy();
      map.clear();
      expect(mocks.map.removeLayer).not.toHaveBeenCalled();
    });

    it("removes tiles", () => {
      mocks.map.removeLayer.mockClear();
      mockEachLayer([{ id: "geo-existing" }]);
      map.clear();
      expect(mocks.map.removeLayer).toHaveBeenCalledOnce();
      mocks.map.removeLayer.mockClear();
    });
  });

  describe("addEventListener", () => {
    it("adds event listeners", () => {
      const fn = () => undefined;
      map.addEventListener("move", fn);
      expect(mocks.map.on).toHaveBeenCalledWith("move", fn);
    });
  });

  describe("getBounds", () => {
    it("gets bounds", () => {
      mocks.map.getBounds.mockClear();
      map.getBounds();
      expect(mocks.map.getBounds).toHaveBeenCalledOnce();
    });
  });

  describe("getZoom", () => {
    it("gets zoom", () => {
      mocks.map.getZoom.mockClear();
      map.getZoom();
      expect(mocks.map.getZoom).toHaveBeenCalledOnce();
    });
  });

  describe("getCenter", () => {
    it("gets center", () => {
      mocks.map.getCenter.mockClear();
      map.getCenter();
      expect(mocks.map.getCenter).toHaveBeenCalledOnce();
    });
  });

  describe("setView", () => {
    it("sets view", () => {
      map.setView({ lon: 1, lat: 2, zoom: 3 });
      expect(mocks.map.setCenter).toHaveBeenCalledWith([1, 2], {
        animate: false,
      });
      expect(mocks.map.setZoom).toHaveBeenCalledWith(3, {
        animate: false,
      });
    });
  });

  describe("getPrecision", () => {
    it("gets precision", () => {
      for (let i = 0; i < 20; i++) {
        vi.mocked(mocks.map.getZoom).mockImplementationOnce(() => i);
        expect(map.getPrecision()).toBeLessThan(20);
      }
    });
  });

  describe("addRectangle", () => {
    it("adds a rectangle", () => {
      map.addRectangle([[1, 2]], "abc");
      expect(mocks.map.addSource).toHaveBeenCalledWith(
        "geo-abc",
        expect.any(Object)
      );
    });
  });

  describe("addGeohashes", () => {
    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn());
    });

    it("adds only new geohashes", async () => {
      const data: string[] = ["db"];
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(Response.json(data));
      await map.addGeoHashes();
      expect(mocks.map.addSource).toHaveBeenCalledWith(
        "geo-db",
        expect.any(Object)
      );
      mocks.map.addSource.mockClear();
      mockEachLayer([{ id: "geo-db" }]);
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        Response.json(["db", "dr"])
      );
      await map.addGeoHashes();
      expect(mocks.map.addSource).toHaveBeenCalledOnce();
      expect(mocks.map.addSource).toHaveBeenCalledWith(
        "geo-dr",
        expect.any(Object)
      );
      mockEachLayer([]);
    });

    it("clears only unfetched geohashes", async () => {
      mockEachLayer([]);
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(Response.json(["db"]));
      await map.addGeoHashes();
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        Response.json(["db", "bc"])
      );
      mockEachLayer([{ id: "geo-db-fill" }]);
      await map.addGeoHashes();
      // does not remove from the first fetch
      expect(mocks.map.removeLayer).not.toHaveBeenCalled();
      vi.mocked(mocks.map.removeLayer).mockClear();
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        Response.json(["dp", "dr"])
      );
      mockEachLayer([{ id: "geo-db-fill" }, { id: "geo-bc-fill" }]);
      await map.addGeoHashes();
      expect(mocks.map.removeLayer).toHaveBeenCalledWith("geo-db-fill");
      expect(mocks.map.removeLayer).toHaveBeenCalledWith("geo-bc-fill");
    });
  });

  describe("updateUrlFromMap", () => {
    it("updates the url", () => {
      const lat = String(Math.random());
      const lng = String(Math.random());
      const zoom = String(Math.floor(Math.random() * 20));
      vi.mocked(mocks.map.getCenter).mockImplementation(() => ({
        lat,
        lng,
      }));
      vi.mocked(mocks.map.getZoom).mockImplementationOnce(() => parseInt(zoom));
      map.updateUrlFromMap();
      expect(window.location.hash).toContain(
        `?lat=${lat}&lng=${lng}&zoom=${zoom}`
      );
    });
  });

  describe("updateMapFromUrl", () => {
    it("updates the map", () => {
      const lat = Math.random();
      const lng = Math.random();
      const zoom = Math.floor(Math.random() * 20);
      window.location.hash = `?lat=${String(lat)}&lng=${String(
        lng
      )}&zoom=${String(zoom)}`;
      map.updateMapFromUrl();
      expect(mocks.map.setCenter).toHaveBeenCalledWith([lng, lat], {
        animate: false,
      });
    });

    it("returns early if no lat in url", () => {
      window.location.hash = "";
      mocks.map.setCenter.mockClear();
      map.updateMapFromUrl();
      // USA defaults
      expect(mocks.map.setCenter).not.toHaveBeenCalled();
    });
  });
});

function mockEachLayer(value: unknown[]) {
  mocks.map.getStyle.mockImplementation(() => ({
    layers: value,
    sources: {
      "geo-example": {},
      "not-geo-example": {},
    },
  }));
}
