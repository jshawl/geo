import unittest
import ../src/geohash

test "can encode":
  check encode(37.25, 123.75) == "wy85bj0hbp21"
  check encode(42.6, -5.6) == "ezs42e44yx96"

test "neighbor":
  check neighbor("9q5", "top") == "9q7"
  check neighbor("9q5", "bottom") == "9mg"
  check neighbor("9q5", "right") == "9qh"
  check neighbor("9q5", "left") == "9q4"

test "sections":
  let north = 40.7355871786238
  let east = -73.95777974265621
  let south = 40.63090494037923
  let west = -74.06145806412303
  let precision = 5
  let sctns = sections(north, east, south, west, precision)
  check sctns.len == 12
  check sctns[0] == encode(north, west, precision)
  check sctns[^1] == encode(south, east, precision)
