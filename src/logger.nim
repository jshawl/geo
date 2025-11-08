import std / [logging]

var logger = newConsoleLogger(fmtStr="[$datetime] - $levelname: ")

proc info*(str: string) =
    logger.log(lvlInfo, str)

proc warn*(str: string) =
    logger.log(lvlWarn, str)
