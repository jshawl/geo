import db_connector/db_sqlite
import std / [times, strutils, json, strformat]
import ./geohash

export DbConn 

type
  Event* = object
    created_at*: DateTime
    lat*, lon*: float
    geohash: string
    speed*: int
    altitude*: int

proc openDb*(dir: string): DbConn =
  open(dir & "app.db", "", "", "")

proc setupDb*(dir: string): DbConn =
  let db = openDb(dir)
  db.exec(sql"""
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      geohash TEXT NOT NULL,
      speed INTEGER NOT NULL DEFAULT 0,
      altitude INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL UNIQUE
    );
    CREATE INDEX IF NOT EXISTS idx_events_geohash ON events(geohash);
    CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
  """)
  return db

proc insert*(db: DbConn, event: Event) =
  let hash = encode(event.lat, event.lon)
  db.exec(
    sql"INSERT INTO events (created_at, lat, lon, geohash, speed, altitude) VALUES (?, ?, ?, ?, ?, ?)",
    event.created_at.format("yyyy-MM-dd'T'HH:mm:ss'.'fff'Z'"),
    event.lat,
    event.lon,
    hash,
    event.speed,
    event.altitude
  )

proc findMultiple*(db: DbConn): seq[Row] =
  let q = sql"SELECT created_at, lat, lon, geohash, speed, altitude from events;"
  db.getAllRows(q)

proc findMultipleEvents*(db: DbConn, dateFrom: string, dateTo: string): seq[Event] =
  if dateFrom.len == 0 or dateTo.len == 0:
    return result
  let q = sql"""
    SELECT created_at, lat, lon, geohash, speed, altitude
    FROM events
    WHERE created_at BETWEEN ? AND ? LIMIT 1000;
  """
  for row in db.rows(q, dateFrom, dateTo):
    result.add Event(
      created_at: parse(row[0], "yyyy-MM-dd'T'HH':'mm':'ss'.'fff'Z'"),
      lat: parseFloat(row[1]),
      lon: parseFloat(row[2]),
      geohash: row[3],
      speed: parseInt(row[4]),
      altitude: parseInt(row[5])
    )

proc findMultipleEvents*(db: DbConn, geohash: string): seq[Event] =
  let q = sql"""
    SELECT created_at, lat, lon, geohash, speed, altitude
    FROM events
    WHERE geohash LIKE ? LIMIT 1000;
  """

  for row in db.rows(q, geohash & "%"):
    result.add Event(
      created_at: parse(row[0], "yyyy-MM-dd'T'HH':'mm':'ss'.'fff'Z'"),
      lat: parseFloat(row[1]),
      lon: parseFloat(row[2]),
      geohash: row[3],
      speed: parseInt(row[4]),
      altitude: parseInt(row[5])
    )

type YearlyCount = object
  year: int
  count: int

proc findYears*(db: DbConn): seq[YearlyCount] =
  let q = sql"SELECT strftime('%Y', created_at) as year, COUNT(*) as count from events group by year"
  for row in db.rows(q):
    result.add YearlyCount(year: parseInt(row[0]), count: parseInt(row[1]))

type MonthlyCount = object
  month: string
  count: int

proc findMonths*(db: DbConn, year: string): seq[MonthlyCount] =
  let q = sql"SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count from events where created_at LIKE ? group by month"
  for row in db.rows(q, year & "%"):
    result.add MonthlyCount(month: row[0], count: parseInt(row[1]))

type DailyCount = object
  day: string
  count: int

proc findDays*(db: DbConn, year: string, month: string): seq[DailyCount] =
  let q = sql"SELECT strftime('%Y-%m-%d', created_at) as day, COUNT(*) as count from events where created_at LIKE ? group by day"
  for row in db.rows(q, year & "-" & month & "%"):
    result.add DailyCount(day: row[0], count: parseInt(row[1]))

proc findGeoHashes*(db: DbConn, north, east, south, west: float, precision: int): seq[string] =
  let hashes = sections(north, east, south, west, precision)
  let placeholders = repeat("?", hashes.len).join(",")
  let raw = fmt"""
    SELECT distinct substr(geohash,1,?) FROM events WHERE substr(geohash,1,?) IN ({placeholders});
  """
  let q = sql raw
  let params = @[$precision, $precision] & hashes
  let rows = db.getAllRows(q, params)
  for row in rows:
    result.add row

proc `%`*(dt: DateTime): JsonNode =
  result = % $dt

proc closeConnection*(db: DbConn) =
  db.close()
