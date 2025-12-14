import unittest
import ../src/server
import ../src/database
import std / [asynchttpserver, tables, os, times, tempfiles]
import json

suite "server":
    setup:
        let tmpDir = createTempDir("tmp", "", "db")
        let db = setupDb(tmpDir & "/")
        db.insert(Event(
            created_at: parse("2000-01-01T00:00:00-05:00", "yyyy-MM-dd'T'HH:mm:sszzz", utc()),
            lat: 1.23456,
            lon: 4.56789
        ))
    teardown:
        removeDir(tmpDir)
        db.closeConnection()
    test "/api/years":
        let (code, body) = handleRequest(db, "/api/years", initTable[string, string]())
        check code == Http200
        let data = %*[{"year": 2000, "count": 1}]
        check body == data
    test "/api/geohashes":
        let (code, body) = handleRequest(db, "/api/geohashes", {
          "north": "3.0",
          "south": "1.0",
          "east": "5.0",
          "west": "4.0",
          "precision": "5"
        }.toTable)
        check code == Http200
        let data = %*["s05pp"]
        check body == data
    test "/api/geohashes 500":
        let (code, body) = handleRequest(db, "/api/geohashes", {
          "north": "3.0",
          "south": "1.0",
          "east": "5.0",
        }.toTable)
        check code == Http500
    test "/api/months":
        let (code, body) = handleRequest(db, "/api/months", {"year": "2000"}.toTable)
        check code == Http200
        let data = %*[{"month": "2000-01", "count": 1}]
        check body == data
    test "/api/days":
        let (code, body) = handleRequest(db, "/api/days", {"year": "2000", "month": "01"}.toTable)
        check code == Http200
        let data = %*[{"day": "2000-01-01", "count": 1}]
        check body == data
    test "/api":
        let (code, body) = handleRequest(db, "/api", {"from": "2000-01-01", "to": "2000-01-02"}.toTable)
        check code == Http200
        let data = %*[{
           "created_at": "2000-01-01T05:00:00+00:00",
           "lat": 1.23456,
           "lon": 4.56789,
           "geohash": "s05ppbwpzd9t"
        }]
        check body == data
