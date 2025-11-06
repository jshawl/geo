import db_connector/db_sqlite

export DbConn 

proc setupDb*(dir: string): DbConn =
  let db = open(dir & "mytest.db", "", "", "")
  db.exec(sql"CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE)")
  return db

proc insert*(db: DbConn, value: string) =
  db.exec(sql"INSERT INTO items (name) VALUES (?)", value)

proc findMultiple*(db: DbConn): seq[Row] =
  let q = sql"SELECT * from items;"
  db.getAllRows(q)

proc closeConnection*(db: DbConn) =
  db.close()
