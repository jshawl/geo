import json
import std / [net, httpclient, os, times]
import ./database
import ./logger

var running = true

proc handleSignal() {.noconv.} =
  info("Received SIGINT, shutting down...")
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
    info("inserted 1 row")
  except:
    warn(getCurrentExceptionMsg())

when isMainModule:
  let baseUrl: string = os.getEnv("BASE_URL")
  let fetcher: DataFetcher = newDataFetcher(realHttpGet, baseUrl)
  let db = setupDb("db/")
  let oneHourInMilliseconds = 1000 * 60 * 60
  while running:
    discard fetchData(db, fetcher)
    sleep(oneHourInMilliseconds)
  db.closeConnection()
  info("byeeee")
