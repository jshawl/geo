import std / [asyncdispatch, asynchttpserver, json, uri, tables, strutils]
import ./database
import ./logger

var running = true

proc handleSignal() {.noconv.} =
  info("Received SIGINT, shutting down...")
  running = false

setControlCHook(handleSignal)

proc handleGetYears (db: DbConn): (HttpCode, string) =
  let years = db.findYears()
  let jsonObj = %* years
  (Http200, jsonObj.pretty())

proc handleGetMonths (db: DbConn, year: string): (HttpCode, string) =
  let months = db.findMonths(year)
  let jsonObj = %* months
  (Http200, jsonObj.pretty())

proc handleGetDays (db: DbConn, year: string, month: string): (HttpCode, string) =
  let days = db.findDays(year, month)
  let jsonObj = %* days
  (Http200, jsonObj.pretty())

proc handleGetGeoHashes (db: DbConn, north, east, south, west: float, precision: int): (HttpCode, string) =
  let hashes = db.findGeoHashes(north, east, south, west, precision)
  let jsonObj = %* hashes
  (Http200, jsonObj.pretty())

proc handleGetEvents (db: DbConn, fromParam, toParam: string): (HttpCode, string) =
  let events = db.findMultipleEvents(fromParam, toParam)
  let jsonObj = %* events
  (Http200, jsonObj.pretty())

proc handleRequest*(db: DbConn, path: string, queryParams: Table[string, string]): (HttpCode, string) =
  case path
  of "/api/years":
    return handleGetYears(db)
  of "/api/geohashes":
    let north = parseFloat(queryParams["north"])
    let east = parseFloat(queryParams["east"])
    let south = parseFloat(queryParams["south"])
    let west = parseFloat(queryParams["west"])
    let precision = parseInt(queryParams["precision"])
    return handleGetGeoHashes(db, north, east, south, west, precision)
  of "/api/months":
    return handleGetMonths(db, queryParams["year"])
  of "/api/days":
    return handleGetDays(db, queryParams["year"], queryParams["month"])
  of "/api":
    return handleGetEvents(db, queryParams["from"], queryParams["to"])
  else:
    return (Http404, "Not found")

proc main {.async.} =
  var server = newAsyncHttpServer()
  let db = setupDb("db/")
  proc cb(req: Request) {.async.} =
    var queryParams = initTable[string, string]()
    for key, value in decodeQuery(req.url.query):
      queryParams[key] = value
    let (code, body) = handleRequest(db, req.url.path, queryParams)
    let headers = {"Content-type": "application/json; charset=utf-8"}
    await req.respond(code, body, headers.newHttpHeaders())

  server.listen(Port(8080)) # or Port(8080) to hardcode the standard HTTP port.
  let port = server.getPort
  info("server listening at http://localhost:" & $port.uint16 & "/" )
  while running:
    if server.shouldAcceptRequest():
      await server.acceptRequest(cb)
    else:
      # too many concurrent connections, `maxFDs` exceeded
      # wait 500ms for FDs to be closed
      await sleepAsync(500)
  db.closeConnection()

when isMainModule:
  waitFor main()
