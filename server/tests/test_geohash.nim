import unittest
import ../src/geohash

test "can encode":
  check encode(37.25, 123.75) == "wy85bj0hbp21"
  check encode(42.6, -5.6) == "ezs42e44yx96"
