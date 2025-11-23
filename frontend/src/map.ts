import "./map.css";
import Geohash from "latlon-geohash";

declare global {
  interface Window {
    mapInstance: any;
    L: {
      map: (selector: string) => Map;
      tileLayer: (...args: unknown[]) => Addable;
      Polyline: Polyline;
      LatLng: LatLng;
      rectangle: (bounds: unknown, options: unknown) => Addable;
    };
  }
}

type Addable = { addTo: (map: Map) => void };

type LatLng = new (lat: number, lon: number) => unknown;
type Polyline = new (...args: unknown[]) => Addable & {
  _bounds: {
    _northEast: unknown;
    _southWest: unknown;
  };
};

type Event = {
  lat: number;
  lon: number;
};

type Map = {
  fitBounds: (arr: Array<unknown>) => void;
  remove: () => void;
  setView: (coords: number[], zoom: number) => void;
  getBounds: () => {
    _northEast: { lat: number; lng: number };
    _southWest: { lat: number; lng: number };
  };
  getZoom: () => number;
  on: (event: string, callback: any) => void;
  _layers: Record<string, { _path: unknown }>;
  removeLayer: (layer: unknown) => void;
};

let map: Map | undefined;

export const render = (events: Event[]) => {
  map ??= window.L.map("map");
  window.L.tileLayer(
    "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
    {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: "mapbox/streets-v11",
      accessToken:
        "pk.eyJ1IjoiYW1ibGVhcHAiLCJhIjoiY2s1MXFlc2tmMDBudTNtcDhwYTNlMXF6NCJ9.5sCbcBl56vskuJ2o_e27uQ",
    }
  ).addTo(map);
  map.setView([40, -95], 4);
  if (events.length) {
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
    map.fitBounds([polyline._bounds._northEast, polyline._bounds._southWest]);
  }
};

export const destroy = () => {
  if (map) {
    map.remove();
    map = undefined;
  }
};

export const clear = () => {
  for (let i in map?._layers) {
    if (map._layers[i]._path != undefined) {
      map.removeLayer(map._layers[i]);
    }
  }
};

export const addEventListener = (event: string, callback: any) => {
  map?.on(event, callback);
};

export const getBounds = () => {
  const { _northEast, _southWest } = map!.getBounds();
  const north = _northEast.lat;
  const east = _northEast.lng;
  const south = _southWest.lat;
  const west = _southWest.lng;
  return { north, east, south, west };
};

export const getZoom = () => map!.getZoom();

export const getPrecision = () => {
  switch (map!.getZoom()) {
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
    case 13:
      return 6;
    case 14:
    case 15:
    case 16:
      return 7;
    case 17:
    case 18:
      return 8;
  }
};

export const addRectangle = (bounds: number[][]) => {
  window.L.rectangle(bounds, {
    color: "#000",
    weight: 0,
    fillOpacity: 0.8,
  }).addTo(map!);
};

let fetchedHashes = [];
export const addGeoHashes = async () => {
  const { north, east, south, west } = getBounds();
  const precision = getPrecision();
  const url = `/api/geohashes?north=${north}&south=${south}&east=${east}&west=${west}&precision=${precision}`;
  const response = await fetch(url);
  const hashes: string[] = await response.json();
  if (fetchedHashes.length != hashes.length) {
    clear();
    fetchedHashes = hashes;
  }
  hashes.forEach((hash) => {
    const { ne, sw } = Geohash.bounds(hash);
    addRectangle([
      [ne.lat, ne.lon],
      [sw.lat, sw.lon],
    ]);
  });
};
