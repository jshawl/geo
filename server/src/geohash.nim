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

  while result.len < precision:
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
const NEIGHBORS = {
  "right": {
    "even": "bc01fg45238967deuvhjyznpkmstqrwx",
    "odd": "p0r21436x8zb9dcf5h7kjnmqesgutwvy"
  }.toTable,
  "left": {
    "even": "238967debc01fg45kmstqrwxuvhjyznp",
    "odd": "14365h7k9dcfesgujnmqp0r2twvyx8zb"
  }.toTable,
  "top": {
    "even": "p0r21436x8zb9dcf5h7kjnmqesgutwvy",
    "odd": "bc01fg45238967deuvhjyznpkmstqrwx"
  }.toTable,
  "bottom": {
    "even": "14365h7k9dcfesgujnmqp0r2twvyx8zb",
    "odd": "238967debc01fg45kmstqrwxuvhjyznp"
  }.toTable
}.toTable

const BORDERS = {
  "right": {
    "even" : "bcfguvyz",
    "odd": "prxz"
  }.toTable,
  "left": {
    "even" : "0145hjnp",
    "odd": "028b"
  }.toTable,
  "top": {
    "even" : "prxz",
    "odd": "bcfguvyz"
  }.toTable,
  "bottom": {
    "even" : "028b",
    "odd": "0145hjnp"
  }.toTable
}.toTable;

proc neighbor*(hash: string, direction: string): string =
  let lastChr = hash[^1]
  let evenOdd = if (hash.len mod 2) == 0: "even" else: "odd"
  var base = hash[0..^2]
  if lastChr in BORDERS[direction][evenOdd]:
    base = neighbor(base, direction)
  base & Base32[NEIGHBORS[direction][evenOdd].find(lastChr)]

proc sections*(north, east, south, west: float, precision: int): seq[string] =
  let topLeft = encode(north, west, precision)
  let topRight = encode(north, east, precision)
  let bottomLeft = encode(south, west, precision)
  let bottomRight = encode(south, east, precision)
  result.add(topLeft)
  while not result.contains(topRight):
    result.add(neighbor(result[^1], "right"))
  let cols = result.len
  while not result.contains(bottomRight):
    result.add(neighbor(result[^cols], "bottom"))
    for i in 1..<cols:
      result.add(neighbor(result[^1], "right"))
