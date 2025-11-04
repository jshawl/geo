import httpclient, os
import db_connector/db_sqlite
import json

type
  HttpGetProc* = proc(url: string): string {.closure.}
  
  DataFetcher* = ref object
    httpGet*: HttpGetProc
    url*: string

proc newDataFetcher*(httpGet: HttpGetProc, url: string): DataFetcher =
  DataFetcher(httpGet: httpGet, url: url)

proc realHttpGet*(url: string): string =
  newHttpClient().getContent(url)

proc setupDb*(dir: string): DbConn =
  let db = open(dir & "mytest.db", "", "", "")
  db.exec(sql"CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE)")
  return db

proc insert(db: DbConn, value: string) =
  db.exec(sql"INSERT INTO items (name) VALUES (?)", value)

proc fetchData*(db: DbConn, f: DataFetcher): JsonNode =
  result = parseJson(f.httpGet(f.url))
  try:
    insert(db, $result["created_at"])
  except DbError:
    echo getCurrentExceptionMsg()

when isMainModule:
  let baseUrl: string = os.getEnv("BASE_URL")
  let fetcher: DataFetcher = newDataFetcher(realHttpGet, baseUrl)
  let db = setupDb("db/")
  discard fetchData(db, fetcher)
  db.close()
