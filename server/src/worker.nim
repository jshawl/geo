import json
import std / [net, httpclient, os, times, strformat]
import ./database
import ./logger

var running = true

proc handleSignal() {.noconv.} =
  info("Received SIGINT, shutting down...")
  running = false

setControlCHook(handleSignal)

const embeddedCaCerts = staticRead("/etc/ssl/certs/ca-certificates.crt")
let certFile = getTempDir() / "ca-certificates.crt"
if not fileExists(certFile):
  writeFile(certFile, embeddedCaCerts)
let sslContext = newContext(verifyMode=CVerifyPeer, caFile=certFile)

proc initHttpClient(): HttpClient =
  newHttpClient(sslContext=sslContext)

type
  HttpGetProc* = proc(url: string): string {.closure.}
  
  DataFetcher* = ref object
    httpGet*: HttpGetProc

proc newDataFetcher*(httpGet: HttpGetProc): DataFetcher =
  DataFetcher(httpGet: httpGet)

proc realHttpGet*(url: string): string =
  let client = initHttpClient()
  defer: client.close()
  return client.getContent(url)

proc fetchData*(db: DbConn, f: DataFetcher, url: string): JsonNode =
  result = parseJson(f.httpGet(url))
  var inserted = 0
  let results = result["Data"]
  for datum in results:
    try:
      let event = Event(
        created_at: parse(datum["Date"].getStr(), "yyyy-MM-dd'T'HH:mm:sszzz", utc()),
        lat: datum["Latitude"].getFloat(),
        lon: datum["Longitude"].getFloat()
      )
      insert(db, event)
      inc inserted
    except: discard
  info(fmt"inserted {inserted}/{results.len} events")
  if inserted > 0:
    discard f.httpGet(os.getEnv("HEALTHCHECK_URL"))

when isMainModule:
  let oneHourInMilliseconds = 1000 * 60 * 60
  let fetcher: DataFetcher = newDataFetcher(realHttpGet)
  discard setupDb("db/")
  while running:
    let yesterday = now() - 1.days
    let dateFrom = yesterday.format("yyyy-MM-dd")
    let tomorrow = now() + 1.days
    let dateTo = tomorrow.format("yyyy-MM-dd")
    let baseUrl: string = os.getEnv("BASE_URL") & "&from=" & dateFrom & "&to=" & dateTo
    let db = openDb("db/")
    discard fetchData(db, fetcher, baseUrl)
    db.closeConnection()
    sleep(oneHourInMilliseconds)
  info("byeeee")
