import "./map.css";
import Geohash from "latlon-geohash";
import { assert } from "./utils";
import mapboxgl from "mapbox-gl";

export interface Event {
  created_at?: string;
  geohash?: string;
  lat: number;
  lon: number;
  id: number;
}

let map: mapboxgl.Map | undefined;
let fetchedHashes: string[] = [];

export const render = (events: Event[], options?: { polyline: boolean }) => {
  fetchedHashes = [];
  mapboxgl.accessToken =
    "pk.eyJ1IjoiYW1ibGVhcHAiLCJhIjoiY2s1MXFlc2tmMDBudTNtcDhwYTNlMXF6NCJ9.5sCbcBl56vskuJ2o_e27uQ";
  map = new mapboxgl.Map({
    container: "map", // container ID
    style: "mapbox://styles/mapbox/outdoors-v12", // style URL
    center: [-95, 40], // starting position [lng, lat]
    zoom: 4, // starting zoom
  });
  map.addControl(new mapboxgl.NavigationControl());
  if (events.length) {
    if (options?.polyline === false) {
      const bounds = new mapboxgl.LngLatBounds();
      events.map((event) => {
        bounds.extend([event.lon, event.lat]);
        const ts = event.created_at?.slice(0, 10);
        assert(ts);
        assert(event.geohash);
        assert(map);
        new mapboxgl.Marker()
          .setLngLat([event.lon, event.lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(
              `<p><a href='/#/${ts}'>${ts}</a> - ${event.geohash} - ${String(
                event.id
              )}</p>`
            )
          )
          .addTo(map);
      });
      map.fitBounds(bounds, {
        padding: 50,
        animate: false,
      });
      return;
    }

    map.on("load", () => {
      const bounds = new mapboxgl.LngLatBounds();
      const polylineCoordinates = events.map((event) => {
        bounds.extend([event.lon, event.lat]);
        return [event.lon, event.lat];
      });
      assert(map);
      map.addSource("polyline", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: polylineCoordinates,
          },
          properties: {},
        },
      });
      map.addLayer({
        id: "polyline",
        type: "line",
        source: "polyline",
        paint: {
          "line-color": "#0000ff",
          "line-width": 3,
        },
      });
      map.fitBounds(bounds, {
        padding: 50,
        animate: false,
      });
    });
  }
};

export const destroy = () => {
  if (map) {
    map.remove();
    map = undefined;
  }
};

const removeLayerOrSource = ({
  id,
  type,
  hashes,
  hashSet,
}: {
  id: string;
  type: "layer" | "source";
  hashSet: Set<string>;
  hashes?: string[];
}) => {
  const hashFromId = id.replace("geo-", "").replace("-fill", "");
  const shouldRemove =
    id.startsWith("geo-") && (hashes ? hashSet.has(hashFromId) : true);
  if (!shouldRemove) {
    return;
  }
  if (type === "layer") {
    map?.removeLayer(id);
  }
  if (type === "source") {
    map?.removeSource(id);
  }
};

export const clear = (hashes?: string[]) => {
  if (!map) {
    return;
  }
  const hashSet = new Set(hashes);

  const style = map.getStyle();

  style.layers.forEach((layer) => {
    removeLayerOrSource({ id: layer.id, type: "layer", hashes, hashSet });
  });

  Object.keys(style.sources).forEach((sourceId) => {
    removeLayerOrSource({ id: sourceId, type: "source", hashes, hashSet });
  });
};

export const addEventListener = (event: string, callback: () => void) => {
  map?.on(event, callback);
};

export const getBounds = () => {
  assert(map);
  const bounds = map.getBounds();
  assert(bounds);
  const north = bounds.getNorthEast().lat;
  const east = bounds.getNorthEast().lng;
  const south = bounds.getSouthWest().lat;
  const west = bounds.getSouthWest().lng;
  return { north, east, south, west };
};

export const getZoom = () => {
  assert(map);
  return Math.floor(map.getZoom());
};

export const getCenter = () => {
  assert(map);
  return map.getCenter();
};

export const setView = ({
  lon,
  lat,
  zoom,
}: {
  lon: number;
  lat: number;
  zoom: number;
}) => {
  assert(map);
  map.setCenter([lon, lat], { animate: false });
  map.setZoom(zoom, { animate: false });
};

export const getPrecision = () => {
  assert(map);
  switch (getZoom()) {
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

export const addRectangle = (bounds: number[][], hash: string) => {
  assert(map);
  const id = `geo-${hash}`;
  map.addSource(id, {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [bounds],
      },
      properties: {},
    },
  });
  map.addLayer({
    id: `${id}-fill`,
    type: "fill",
    source: id,
    paint: {
      "fill-color": "#ff00ea",
      "fill-opacity": 0.5,
    },
  });
  return `${id}-fill`;
};

const filterHashes = (incoming: string[]) => {
  const hashSet = new Set(incoming);
  const existingHashSet = new Set(fetchedHashes);
  const newHashes = incoming.filter((hash) => !existingHashSet.has(hash));
  const obsoleteHashes = fetchedHashes.filter((hash) => !hashSet.has(hash));
  return { obsoleteHashes, newHashes };
};

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
  const { obsoleteHashes, newHashes } = filterHashes(hashes);
  clear(obsoleteHashes);
  fetchedHashes = hashes;
  newHashes.forEach((hash) => {
    const { ne, sw } = Geohash.bounds(hash);
    const rectId = addRectangle(
      [
        [sw.lon, sw.lat],
        [sw.lon, ne.lat],
        [ne.lon, ne.lat],
        [ne.lon, sw.lat],
        [sw.lon, sw.lat],
      ],
      hash
    );
    new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    });
    assert(map);
    map.on("click", rectId, (e) => {
      const coordinates = e.lngLat;
      assert(map);
      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`<a href="/#/${hash}">${hash}</a>`)
        .addTo(map);
    });
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
  setView({ lon, lat, zoom });
};
