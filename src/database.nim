import db_connector/db_sqlite
import std / [times]
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

proc closeConnection*(db: DbConn) =
  db.close()
