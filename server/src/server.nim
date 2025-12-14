import std / [asyncdispatch, asynchttpserver, json, uri, tables, strutils]
import ./database
import ./logger

var running = true

proc handleSignal() {.noconv.} =
  info("Received SIGINT, shutting down...")
  running = false

setControlCHook(handleSignal)

proc handleRequest*(db: DbConn, path: string, queryParams: Table[string, string]): (HttpCode, JsonNode) =
  try:
    case path
    of "/api/years":
      let years = db.findYears()
      return (Http200, %* years)
    of "/api/geohashes":
      let north = parseFloat(queryParams["north"])
      let east = parseFloat(queryParams["east"])
      let south = parseFloat(queryParams["south"])
      let west = parseFloat(queryParams["west"])
      let precision = parseInt(queryParams["precision"])
      let hashes = db.findGeoHashes(north, east, south, west, precision)
      return (Http200, %* hashes)
    of "/api/months":
      let months = db.findMonths(queryParams["year"])
      return (Http200, %* months)
    of "/api/days":
      let days = db.findDays(queryParams["year"], queryParams["month"])
      return (Http200, %* days)
    of "/api":
      let events = if queryParams.hasKey("geohash"):
        db.findMultipleEvents(queryParams["geohash"])
      else:
        db.findMultipleEvents(queryParams["from"], queryParams["to"])
      return (Http200, %* events)
    else:
      return (Http404, %* "Not found")
  except CatchableError as e:
    error($e.name & " - " & e.msg)
    return (Http500, %* "Internal server error")

proc main {.async.} =
  var server = newAsyncHttpServer()
  let db = setupDb("db/")
  proc cb(req: Request) {.async.} =
    var queryParams = initTable[string, string]()
    for key, value in decodeQuery(req.url.query):
      queryParams[key] = value
    let (code, body) = handleRequest(db, req.url.path, queryParams)
    let headers = {"Content-type": "application/json; charset=utf-8"}
    await req.respond(code, body.pretty(), headers.newHttpHeaders())

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
