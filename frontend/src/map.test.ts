// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import * as map from "./map";
import type * as LeafletTypes from "leaflet";

let mockLeaflet: Partial<typeof LeafletTypes> & Partial<LeafletTypes.Map>;

describe("map", () => {
  beforeEach(() => {
    mockLeaflet = {
      map: vi.fn().mockReturnThis(),
      // @ts-expect-error missing wms
      tileLayer: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      setView: vi.fn(),
      LatLng: vi.fn(),
      // @ts-expect-error Polyline is a constructor
      Polyline: vi.fn().mockImplementation(function () {
        return {
          addTo: vi.fn(),
          getBounds: vi.fn(),
        };
      }),
      fitBounds: vi.fn(),
      getBounds: vi.fn().mockImplementation(() => ({
        getNorthEast: () => ({ lat: 1.23 }),
        getSouthWest: () => ({ lat: 1.23 }),
      })),
      featureGroup: vi.fn().mockReturnThis(),
      marker: vi.fn().mockReturnThis(),
      bindPopup: vi.fn(),
      remove: vi.fn(),
      eachLayer: vi.fn(),
      removeLayer: vi.fn(),
      on: vi.fn(),
      getZoom: vi.fn(),
      getCenter: vi.fn(),
      rectangle: vi.fn().mockReturnThis(),
    };
    vi.stubGlobal("L", mockLeaflet);
    map.destroy();
    map.render([{ lat: 1.23, lon: 4.56 }]);
  });

  describe("render", () => {
    it("adds a polyline", () => {
      expect(mockLeaflet.Polyline).toHaveBeenCalled();
    });

    it("polyline: false", () => {
      vi.mocked(mockLeaflet.Polyline)?.mockClear();
      map.render(
        [{ lat: 1.23, lon: 4.56, created_at: "2025-12-20", geohash: "abc" }],
        {
          polyline: false,
        }
      );
      expect(mockLeaflet.Polyline).not.toHaveBeenCalled();
    });

    it("handles empty events", () => {
      vi.mocked(mockLeaflet.Polyline)?.mockClear();
      map.render([]);
      expect(mockLeaflet.Polyline).not.toHaveBeenCalled();
    });
  });

  describe("destroy", () => {
    it("supports no map", () => {
      map.destroy();
      map.destroy();
      expect(mockLeaflet.remove).toHaveBeenCalledOnce();
    });
  });

  describe("clear", () => {
    it("supports no map", () => {
      map.destroy();
      map.clear();
      expect(mockLeaflet.removeLayer).not.toHaveBeenCalled();
    });

    it("supports undefined layer paths", () => {
      mockEachLayer({ _path: undefined });
      map.clear();
      expect(mockLeaflet.removeLayer).not.toHaveBeenCalled();
    });

    it("removes tiles", () => {
      mockEachLayer({ _path: true });
      map.clear();
      expect(mockLeaflet.removeLayer).toHaveBeenCalledOnce();
    });
  });

  describe("addEventListener", () => {
    it("adds event listeners", () => {
      const fn = () => undefined;
      map.addEventListener("move", fn);
      expect(mockLeaflet.on).toHaveBeenCalledWith("move", fn);
    });
  });

  describe("getBounds", () => {
    it("gets bounds", () => {
      map.getBounds();
      expect(mockLeaflet.getBounds).toHaveBeenCalledOnce();
    });
  });

  describe("getZoom", () => {
    it("gets zoom", () => {
      map.getZoom();
      expect(mockLeaflet.getZoom).toHaveBeenCalledOnce();
    });
  });

  describe("getCenter", () => {
    it("gets center", () => {
      map.getCenter();
      expect(mockLeaflet.getCenter).toHaveBeenCalledOnce();
    });
  });

  describe("setView", () => {
    it("sets view", () => {
      map.setView([0, 0], 1);
      expect(mockLeaflet.setView).toHaveBeenCalledWith([0, 0], 1);
    });
  });

  describe("getPrecision", () => {
    it("gets precision", () => {
      for (let i = 0; i < 20; i++) {
        vi.mocked(mockLeaflet.getZoom)?.mockImplementationOnce(() => i);
        expect(map.getPrecision()).toBeLessThan(20);
      }
    });
  });

  describe("addRectangle", () => {
    it("adds a rectangle", () => {
      map.addRectangle([[1, 2]]);
      expect(mockLeaflet.rectangle).toHaveBeenCalledOnce();
    });
  });

  describe("addGeohashes", () => {
    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn());
    });

    it("adds geohashes", async () => {
      const data: string[] = ["db"];
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(Response.json(data));
      await map.addGeoHashes();
      expect(mockLeaflet.rectangle).toHaveBeenCalledOnce();
    });

    it("clears existing geohashes", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(Response.json(["db"]));
      await map.addGeoHashes();
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        Response.json(["db", "bc"])
      );
      mockEachLayer({ _path: true });
      await map.addGeoHashes();
      expect(mockLeaflet.removeLayer).toHaveBeenCalledOnce();
      // no clear this time because the hashes are the same
      vi.mocked(mockLeaflet.removeLayer)?.mockClear();
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        Response.json(["db", "bc"])
      );
      void map.addGeoHashes();
      expect(mockLeaflet.removeLayer).not.toHaveBeenCalled();
    });
  });

  describe("updateUrlFromMap", () => {
    it("updates the url", () => {
      const lat = String(Math.random());
      const lng = String(Math.random());
      const zoom = String(Math.floor(Math.random() * 20));
      vi.mocked(mockLeaflet.getCenter)?.mockImplementation(
        () =>
          ({
            lat,
            lng,
          } as unknown as LeafletTypes.LatLng)
      );
      vi.mocked(mockLeaflet.getZoom)?.mockImplementationOnce(() =>
        parseInt(zoom)
      );
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
      expect(mockLeaflet.setView).toHaveBeenCalledWith([lat, lng], zoom);
    });

    it("returns early if no lat in url", () => {
      window.location.hash = "";
      map.updateMapFromUrl();
      // USA defaults
      expect(mockLeaflet.setView).toHaveBeenCalledWith([40, -95], 4);
    });
  });
});

function mockEachLayer(value: unknown) {
  vi.mocked(mockLeaflet.eachLayer)?.mockImplementationOnce(
    (
      fn: (layer: LeafletTypes.Layer, context?: unknown) => void
    ): LeafletTypes.Map => {
      // @ts-expect-error - passing mock value that doesn't fully implement Layer
      fn(value);
      return undefined as unknown as LeafletTypes.Map;
    }
  );
}
