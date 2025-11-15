import db_connector/db_sqlite
import std / [times, strutils, json]
import ./geohash

export DbConn 

type
  Event* = object
    created_at*: DateTime
    lat*, lon*: float

proc setupDb*(dir: string): DbConn =
  let db = open(dir & "app.db", "", "", "")
  db.exec(sql"""
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      geohash TEXT NOT NULL,
      created_at TEXT NOT NULL UNIQUE
    );
    CREATE INDEX IF NOT EXISTS idx_events_geohash ON events(geohash);
    CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
  """)
  return db

proc insert*(db: DbConn, event: Event) =
  let hash = encode(event.lat, event.lon)
  db.exec(
    sql"INSERT INTO events (created_at, lat, lon, geohash) VALUES (?, ?, ?, ?)",
    event.created_at.format("yyyy-MM-dd'T'HH:mm:ss'.'fff'Z'"),
    event.lat,
    event.lon,
    hash
  )

proc findMultiple*(db: DbConn): seq[Row] =
  let q = sql"SELECT created_at, lat, lon, geohash from events;"
  db.getAllRows(q)

proc findMultipleEvents*(db: DbConn, dateFrom: string, dateTo: string): seq[Event] =
  if dateFrom.len == 0 or dateTo.len == 0:
    return result
  let q = sql"""
    SELECT created_at, lat, lon, geohash
    FROM events
    WHERE created_at BETWEEN ? AND ? LIMIT 1000;
  """
  for row in db.rows(q, dateFrom, dateTo):
    result.add Event(
      created_at: parse(row[0], "yyyy-MM-dd'T'HH':'mm':'ss'.'fff'Z'"),
      lat: parseFloat(row[1]),
      lon: parseFloat(row[2]),
    )

proc `%`*(dt: DateTime): JsonNode =
  result = % $dt

proc closeConnection*(db: DbConn) =
  db.close()
