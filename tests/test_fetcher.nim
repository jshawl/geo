import ../src/fetcher
import unittest
import db_connector/db_sqlite
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
    db.close()

  test "fetchData inserts values":
    let query = sql"SELECT * from items;"
    check db.getAllRows(query).len == 0
    discard fetchData(db, fetcher)
    check db.getAllRows(query).len == 1

  test "fetchData does not insert duplicate values":
    let query = sql"SELECT * from items;"
    check db.getAllRows(query).len == 0
    discard fetchData(db, fetcher)
    discard fetchData(db, fetcher)
    discard fetchData(db, fetcher)
    check db.getAllRows(query).len == 1
