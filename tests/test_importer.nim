import ../src/importer
import ../src/database
import unittest
import std/[os, tempfiles, strutils]

suite "importer":
  setup:
    let tmpDir = createTempDir("tmp", "", "db")
    let db = setupDb(tmpDir & "/")
  teardown:
    removeDir(tmpDir)
    db.closeConnection()

  test "parseEvents (json)":
    check parseEvents("tests/data.json").len == 2
    expect IOError:
      discard parseEvents("file-doesn't-exist.json")

  test "parseEvents (sql)":
    check parseEvents("tests/data.sql").len == 2

  test "importEvents":
    check db.findMultiple().len == 0
    db.importEvents(parseEvents("tests/data.json"))
    let results = db.findMultiple()
    check results.len == 2
    check results[0][0] == "2025-11-07T23:30:43.000Z"
    check parseFloat(results[0][1]) == 1.234
    check parseFloat(results[0][2]) == -5.678
    check db.findMultipleEvents("2025-11-07", "2025-11-08").len == 2
