import "./map.css";

declare global {
  interface Window {
    mapInstance: any;
    L: {
      map: (selector: string) => Map;
      tileLayer: (...args: unknown[]) => Addable;
      Polyline: Polyline;
      LatLng: LatLng;
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
  map.setView([0, 0], 10);
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
};

export const destroy = () => {
  if (map) {
    map.remove();
    map = undefined;
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
    case 8:
      return 4;
    case 9:
    case 10:
    case 11:
      return 5;
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
