import "./map.css";
import Geohash from "latlon-geohash";
import type * as LeafletTypes from "leaflet";
import { assert } from "./utils";

export interface Event {
  created_at?: string;
  geohash?: string;
  lat: number;
  lon: number;
}

let map: LeafletTypes.Map | undefined;

export const render = (events: Event[], options?: { polyline: boolean }) => {
  map ??= window.L.map("map");
  window.L.tileLayer(
    "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
    {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: "mapbox/streets-v11",
      accessToken:
        "pk.eyJ1IjoiYW1ibGVhcHAiLCJhIjoiY2s1MXFlc2tmMDBudTNtcDhwYTNlMXF6NCJ9.5sCbcBl56vskuJ2o_e27uQ",
    } as L.TileLayerOptions
  ).addTo(map);
  map.setView([40, -95], 4);
  if (events.length) {
    if (options?.polyline === false) {
      const markers = window.L.featureGroup().addTo(map);
      events.map((event) => {
        const ts = event.created_at?.slice(0, 10);
        assert(ts);
        assert(event.geohash);
        window.L.marker([event.lat, event.lon])
          .addTo(markers)
          .bindPopup(`<a href='/#/${ts}'>${ts}</a> - ${event.geohash}`);
      });
      map.fitBounds(markers.getBounds());
      return;
    }
    const pointList = events.map(
      (event) => new window.L.LatLng(event.lat, event.lon)
    );
    const polyline = new window.L.Polyline(pointList, {
      color: "blue",
      weight: 5,
      opacity: 0.5,
      smoothFactor: 5,
    });

    polyline.addTo(map);
    map.fitBounds(polyline.getBounds());
  }
};

export const destroy = () => {
  if (map) {
    map.remove();
    map = undefined;
  }
};

export const clear = () => {
  map?.eachLayer((layer) => {
    // @ts-expect-error _path is a private property 🙈
    if (layer._path != undefined) {
      map?.removeLayer(layer);
    }
  });
};

export const addEventListener = (
  event: string,
  callback: LeafletTypes.LeafletEventHandlerFn
) => {
  map?.on(event, callback);
};

export const getBounds = () => {
  assert(map);
  const bounds = map.getBounds();
  const north = bounds.getNorthEast().lat;
  const east = bounds.getNorthEast().lng;
  const south = bounds.getSouthWest().lat;
  const west = bounds.getSouthWest().lng;
  return { north, east, south, west };
};

export const getZoom = () => {
  assert(map);
  return map.getZoom();
};

export const getCenter = () => {
  assert(map);
  return map.getCenter();
};

export const setView = (coords: LeafletTypes.LatLngExpression, zoom: number) =>
  map?.setView(coords, zoom);

export const getPrecision = () => {
  assert(map);
  switch (map.getZoom()) {
    case 0:
    case 1:
    case 2:
      return 1;
    case 3:
    case 4:
      return 2;
    case 5:
    case 6:
      return 3;
    case 7:
      return 4;
    case 8:
    case 9:
    case 10:
      return 5;
    case 11:
    case 12:
      return 6;
    case 13:
    case 14:
      return 7;
    case 15:
    case 16:
    case 17:
    case 18:
      return 8;
    default:
      return 1;
  }
};

export const addRectangle = (bounds: LeafletTypes.LatLngBoundsExpression) => {
  assert(map);
  return window.L.rectangle(bounds, {
    color: "#000",
    weight: 1,
    fillOpacity: 0.3,
    stroke: true,
  }).addTo(map);
};

let fetchedHashes = [];
export const addGeoHashes = async () => {
  const { north, east, south, west } = getBounds();
  const precision = getPrecision();
  const params = new URLSearchParams();
  const data: Record<string, number> = { north, east, south, west, precision };
  Object.keys(data).forEach((key) => {
    params.append(key, String(data[key]));
  });
  const url = `/api/geohashes?${params.toString()}`;
  const response = await fetch(url);
  const hashes = (await response.json()) as string[];
  if (fetchedHashes.length != hashes.length) {
    clear();
    fetchedHashes = hashes;
  }
  hashes.forEach((hash) => {
    const { ne, sw } = Geohash.bounds(hash);
    const rect = addRectangle([
      [ne.lat, ne.lon],
      [sw.lat, sw.lon],
    ]);
    rect.bindPopup(`<a href="/#/${hash}">${hash}</a>`);
  });
};

export const updateUrlFromMap = () => {
  const { lat, lng } = getCenter();
  const values: Record<string, number> = {
    lat,
    lng,
    zoom: getZoom(),
  };
  const params = new URLSearchParams();
  for (const key in values) {
    params.append(key, String(values[key]));
  }
  window.history.pushState(null, "", "#/?" + params.toString());
};

export const updateMapFromUrl = () => {
  if (!location.hash.includes("lat=")) {
    return;
  }
  const params = new URLSearchParams(window.location.hash.slice(2));
  const [lat, lon, zoom] = ["lat", "lng", "zoom"].map((key) => {
    const value = params.get(key);
    assert(typeof value === "string");
    return parseFloat(value);
  });
  setView([lat, lon], zoom);
};
