import db_connector/db_sqlite
import json
import std / [net, httpclient, os, posix, logging]

var logger = newConsoleLogger(fmtStr="[$datetime] - $levelname: ")
var running = true

proc handleSignal() {.noconv.} =
  logger.log(lvlInfo, "Received SIGINT, shutting down...")
  running = false

setControlCHook(handleSignal)

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
    logger.log(lvlInfo, "inserted 1 row")
  except:
    logger.log(lvlWarn, getCurrentExceptionMsg())

when isMainModule:
  let baseUrl: string = os.getEnv("BASE_URL")
  let fetcher: DataFetcher = newDataFetcher(realHttpGet, baseUrl)
  let db = setupDb("db/")
  let oneHourInMilliseconds = 1000 * 60 * 60
  while running:
    discard fetchData(db, fetcher)
    sleep(oneHourInMilliseconds)
  db.close()
  logger.log(lvlInfo, "byeeee")
