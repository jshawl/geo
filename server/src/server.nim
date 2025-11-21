import std / [asyncdispatch, asynchttpserver, json, uri, tables]
import ./database
import ./logger

var running = true

proc handleSignal() {.noconv.} =
  info("Received SIGINT, shutting down...")
  running = false

setControlCHook(handleSignal)

proc handleGetYears (req: Request, db: DbConn) {.async.} =
  let headers = {"Content-type": "application/json; charset=utf-8"}
  let years = db.findYears()
  let jsonObj = %* years
  await req.respond(Http200, jsonObj.pretty(), headers.newHttpHeaders())

proc handleGetMonths (req: Request, db: DbConn, year: string) {.async.} =
  let headers = {"Content-type": "application/json; charset=utf-8"}
  let months = db.findMonths(year)
  let jsonObj = %* months
  await req.respond(Http200, jsonObj.pretty(), headers.newHttpHeaders())

proc handleGetDays (req: Request, db: DbConn, year: string, month: string) {.async.} =
  let headers = {"Content-type": "application/json; charset=utf-8"}
  let days = db.findDays(year, month)
  let jsonObj = %* days
  await req.respond(Http200, jsonObj.pretty(), headers.newHttpHeaders())

proc main {.async.} =
  var server = newAsyncHttpServer()
  let db = setupDb("db/")
  proc cb(req: Request) {.async.} =
    echo (req.reqMethod, req.url, req.headers)
    if req.url.path == "/api/years":
      await handleGetYears(req, db)
    var queryParams = initTable[string, string]()
    for key, value in decodeQuery(req.url.query):
      echo "value:" & value
      queryParams[key] = value
    var jsonObj = %* []
    if req.url.path == "/api/months" and queryParams.hasKey("year"):
      await handleGetMonths(req, db, queryParams["year"])
    if req.url.path == "/api/days" and queryParams.hasKey("year") and queryParams.hasKey("month"):
      await handleGetDays(req, db, queryParams["year"], queryParams["month"])
    if queryParams.hasKey("from") and queryParams.hasKey("to"):
      let events = db.findMultipleEvents(queryParams["from"], queryParams["to"])
      jsonObj = %* events
    let headers = {"Content-type": "application/json; charset=utf-8"}
    await req.respond(Http200, jsonObj.pretty(), headers.newHttpHeaders())

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

waitFor main()
