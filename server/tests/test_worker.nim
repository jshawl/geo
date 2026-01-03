import ../src/worker
import ../src/database
import unittest
import std/[os, tempfiles, strutils, httpclient]

proc createMockGet(response: string): proc(url: string): string =
  return proc(url: string): string = response

suite "worker":
  setup:
    let tmpDir = createTempDir("tmp", "", "db")
    let db = setupDb(tmpDir & "/")
    let mockGet = createMockGet(readFile("tests/response.json"))
    let fetcher = DataFetcher(httpGet: mockGet)
  teardown:
    removeDir(tmpDir)
    db.closeConnection()

  test "fetchData inserts values":
    check db.findMultiple().len == 0
    discard fetchData(db, fetcher, "https://example.com/")
    check db.findMultiple().len == 1

  test "fetchData does not insert duplicate values":
    check db.findMultiple().len == 0
    discard fetchData(db, fetcher, "https://example.com/")
    discard fetchData(db, fetcher, "https://example.com/")
    discard fetchData(db, fetcher, "https://example.com/")
    let results = db.findMultiple()
    check results.len == 1
    # converted to utc
    check results[0][0] == "2025-11-04T12:14:27.000Z"
    check parseFloat(results[0][1]) == 1.234
    check parseFloat(results[0][2]) == 5.678
    check results[0][3] == "s0hp10wsdfr8"

  test "fetchData doesn't throw":
    let mockGet500 = proc (url: string): string =
      raise newException(HttpRequestError, "Internal Server Error")
    let fetcher500 = DataFetcher(httpGet: mockGet500)
    var didThrow = false
    try:
      discard fetchData(db, fetcher500, "https://example.com")
    except HttpRequestError:
      didThrow = true
    check didThrow == false
