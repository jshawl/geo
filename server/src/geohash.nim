import std / [ tables, strutils ]
const Base32 = "0123456789bcdefghjkmnpqrstuvwxyz"

proc encode*(lat, lon: float, precision = 12): string =
  var 
    bit = 0
    evenBit = true
    idx = 0
    latMin = -90.0
    latMax = 90.0
    lonMin = -180.0
    lonMax = 180.0
  result = newStringOfCap(precision)

  while result.len < 12:
    if evenBit:
      # bisect E-W longitude
      let lonMid = (lonMin + lonMax) / 2
      if lon >= lonMid:
        idx = idx shl 1 or 1 
        lonMin = lonMid
      else:
        idx = idx shl 1
        lonMax = lonMid
    else:
      # bisect N-S latitude
      let latMid = (latMin + latMax) / 2
      if lat >= latMid:
        idx = idx shl 1 or 1
        latMin = latMid
      else:
        idx = idx shl 1
        latMax = latMid
    evenBit = not evenBit
    inc bit
    if bit == 5:
      # 5 bits gives us a character: append it and start over
      result.add(Base32[idx])
      bit = 0
      idx = 0

# https://github.com/davetroy/geohash-js/blob/master/geohash.js
var NEIGHBORS = {
  "right": {"even": "bc01fg45238967deuvhjyznpkmstqrwx"}.toTable,
  "left": {"even": "238967debc01fg45kmstqrwxuvhjyznp"}.toTable,
  "top": {"even": "p0r21436x8zb9dcf5h7kjnmqesgutwvy"}.toTable,
  "bottom": {"even": "14365h7k9dcfesgujnmqp0r2twvyx8zb"}.toTable
}.toTable

var BORDERS = {
  "right": { "even" : "bcfguvyz" }.toTable,
  "left": { "even" : "0145hjnp" }.toTable,
  "top": { "even" : "prxz" }.toTable,
  "bottom": { "even" : "028b" }.toTable
}.toTable;

NEIGHBORS["bottom"]["odd"] = NEIGHBORS["left"]["even"];
NEIGHBORS["top"]["odd"] = NEIGHBORS["right"]["even"];
NEIGHBORS["left"]["odd"] = NEIGHBORS["bottom"]["even"];
NEIGHBORS["right"]["odd"] = NEIGHBORS["top"]["even"];

BORDERS["bottom"]["odd"] = BORDERS["left"]["even"];
BORDERS["top"]["odd"] = BORDERS["right"]["even"];
BORDERS["left"]["odd"] = BORDERS["bottom"]["even"];
BORDERS["right"]["odd"] = BORDERS["top"]["even"];

proc neighbor*(hash: string, direction: string): string =
  let lastChr = hash[^1]
  let evenOdd = if (hash.len mod 2) == 0: "even" else: "odd"
  var base = hash[0..^2]
  if lastChr in BORDERS[direction][evenOdd]:
    base = neighbor(base, direction)
  base & Base32[NEIGHBORS[direction][evenOdd].find(lastChr)]