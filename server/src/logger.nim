import std / [logging]

var logger {.threadvar.}: ConsoleLogger

proc getLogger(): ConsoleLogger =
  if logger.isNil:
    logger = newConsoleLogger(fmtStr="[$datetime] - $levelname: ")
  logger

proc info*(str: string) =
    getLogger().log(lvlInfo, str)

proc warn*(str: string) =
    getLogger().log(lvlWarn, str)

proc error*(str: string) =
    getLogger().log(lvlError, str)
