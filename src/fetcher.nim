import db_connector/db_sqlite
import json
import std / [net, httpclient, os]
import std/net

type
  HttpGetProc* = proc(url: string): string {.closure.}
  
  DataFetcher* = ref object
    httpGet*: HttpGetProc
    url*: string

proc newDataFetcher*(httpGet: HttpGetProc, url: string): DataFetcher =
  DataFetcher(httpGet: httpGet, url: url)

proc realHttpGet*(url: string): string =
  const embeddedCaCerts = staticRead("/etc/ssl/certs/ca-certificates.crt")
  let certFile = getTempDir() / "ca-certificates.crt"
  writeFile(certFile, embeddedCaCerts)
  newHttpClient(sslContext=newContext(verifyMode=CVerifyPeer,caFile=certFile)).getContent(url)

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
  except:
    echo getCurrentExceptionMsg()

when isMainModule:
  let baseUrl: string = os.getEnv("BASE_URL")
  let fetcher: DataFetcher = newDataFetcher(realHttpGet, baseUrl)
  let db = setupDb("db/")
  discard fetchData(db, fetcher)
  echo "success!"
  db.close()
