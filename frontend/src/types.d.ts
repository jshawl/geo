declare module "latlon-geohash" {
  interface latlng {
    lat: number;
    lon: number;
  }
  export const bounds: (hash: string) => { ne: latlng; sw: latlng };
}
