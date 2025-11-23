declare module "latlon-geohash" {
  type latlng = { lat: number; lon: number };
  export const bounds: (hash: string) => { ne: latlng; sw: latlng };
}
