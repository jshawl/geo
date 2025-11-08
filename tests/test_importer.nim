import ../src/importer
import ../src/database
import unittest
import std/[os, tempfiles]

suite "importer":
  setup:
    let tmpDir = createTempDir("tmp", "", "db")
    let db = setupDb(tmpDir & "/")
  teardown:
    removeDir(tmpDir)
    db.closeConnection()

  test "parseEvents":
    check parseEvents("tests/data.json").len == 2

