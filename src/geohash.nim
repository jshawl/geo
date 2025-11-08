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
