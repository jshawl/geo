import ../src/fetcher
import ../src/database
import unittest
import std/[os, tempfiles]

proc createMockGet(response: string): proc(url: string): string =
  return proc(url: string): string = response

suite "fetcher":
  setup:
    let tmpDir = createTempDir("tmp", "", "db")
    let db = setupDb(tmpDir & "/")
    let mockGet = createMockGet(readFile("tests/response.json"))
    let fetcher = DataFetcher(httpGet: mockGet, url: "http://test")
  teardown:
    removeDir(tmpDir)
    db.closeConnection()

  test "fetchData inserts values":
    check db.findMultiple().len == 0
    discard fetchData(db, fetcher)
    check db.findMultiple().len == 1

  test "fetchData does not insert duplicate values":
    check db.findMultiple().len == 0
    discard fetchData(db, fetcher)
    discard fetchData(db, fetcher)
    discard fetchData(db, fetcher)
    check db.findMultiple().len == 1
