import json
import std / [net, httpclient, os, logging, times]
import ./database

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

proc fetchData*(db: DbConn, f: DataFetcher): JsonNode =
  result = parseJson(f.httpGet(f.url))
  try:
    let event = Event(
      created_at: parse(result["Date"].getStr(), "yyyy-MM-dd'T'HH:mm:ss'.'fff'Z'", utc()),
      lat: result["Latitude"].getFloat(),
      lon: result["Longitude"].getFloat()
    )
    insert(db, event)
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
  db.closeConnection()
  logger.log(lvlInfo, "byeeee")
