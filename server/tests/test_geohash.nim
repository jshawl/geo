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
