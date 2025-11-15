import db_connector/db_sqlite
import std / [times, strformat, os, strutils, algorithm]
import ./logger

var running = true

proc handleSignal() {.noconv.} =
  info("Received SIGINT, shutting down...")
  running = false

setControlCHook(handleSignal)

proc rotateBackups(backupDir: string, keepCount: int) =
  var backups: seq[tuple[path: string, time: Time]] = @[]
  
  # Only collect files matching backup pattern
  for file in walkDir(backupDir):
    if file.kind == pcFile and file.path.contains("backup-") and 
       (file.path.endsWith(".db")):
      let info = getFileInfo(file.path)
      backups.add((file.path, info.lastWriteTime))
  
  # Sort by time (oldest first)
  backups.sort(proc (a, b: auto): int = cmp(a.time, b.time))
  
  # Delete oldest backups beyond keepCount
  let toDelete = backups.len - keepCount
  if toDelete > 0:
    for i in 0 ..< toDelete:
      info(fmt"Deleting old backup: {backups[i].path}")
      removeFile(backups[i].path)

when isMainModule:
    while running:
        sleep(3 * 60 * 60 * 1000)
        info("Backing up...")
        let db = open("db/app.db", "", "", "")
        let timestamp = now().format("yyyyMMdd-HHmmss")
        let backupPath = fmt"db/backup-{timestamp}.db"
        db.exec(sql"VACUUM INTO ?", backupPath)
        db.close()
        rotateBackups("db", keepCount = 7)
        sleep(21 * 60 * 60 * 1000)
