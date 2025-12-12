import "./map.css";
import Geohash from "latlon-geohash";
import type * as LeafletTypes from "leaflet";

type Event = {
  lat: number;
  lon: number;
};

let map: LeafletTypes.Map | undefined;

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
    } as L.TileLayerOptions
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
    // @ts-expect-error private
    if (layer._path != undefined) {
      map?.removeLayer(layer);
    }
  });
};

export const addEventListener = (event: string, callback: any) => {
  map?.on(event, callback);
};

export const getBounds = () => {
  const bounds = map!.getBounds();
  const north = bounds.getNorthEast().lat;
  const east = bounds.getNorthEast().lng;
  const south = bounds.getSouthWest().lat;
  const west = bounds.getSouthWest().lng;
  return { north, east, south, west };
};

export const getZoom = () => map!.getZoom();
export const getCenter = () => map!.getCenter();
export const setView = (coords: LeafletTypes.LatLngExpression, zoom: number) =>
  map?.setView(coords, zoom);

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
      return 6;
    case 13:
    case 14:
      return 7;
    case 15:
    case 16:
    case 17:
    case 18:
      return 8;
  }
};

export const addRectangle = (bounds: LeafletTypes.LatLngBoundsExpression) => {
  return window.L.rectangle(bounds, {
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

export const updateUrlFromMap = () => {
  const values: Record<string, number> = {
    ...getCenter(),
    zoom: getZoom(),
  };
  const params = new URLSearchParams();
  for (let key in values) {
    params.append(key, `${values[key]}`);
  }
  window.history.pushState(null, "", "#/?" + params.toString());
};

export const updateMapFromUrl = () => {
  const hasParams = /lat=/.test(location.hash);
  if (!hasParams) {
    return;
  }
  const params = new URLSearchParams(window.location.hash.slice(2));
  const [lat, lon, zoom] = ["lat", "lng", "zoom"].map((key) =>
    parseFloat(params.get(key) ?? "")
  );
  setView([lat, lon], zoom);
};
