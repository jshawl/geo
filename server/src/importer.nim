import std / [json, times, cmdline, strutils]
import ./database

proc parseTime(time: string): DateTime =
    parse(time, "yyyyMMdd'T'HHmmssZZZ")

proc parseJsonEvents(file: string): seq[Event] =
    let data = parseFile(file)
    for entry in data:
        for segment in entry["segments"]:
            case segment["type"].getStr()
            of "place":
                result.add Event(
                    created_at: parseTime(segment["startTime"].getStr()),
                    lat: segment["place"]["location"]["lat"].getFloat(),
                    lon: segment["place"]["location"]["lon"].getFloat()
                )
            of "move":
                for activity in segment["activities"]:
                    for trackPoint in activity["trackPoints"]:
                        result.add Event(
                            created_at: parseTime(trackPoint["time"].getStr()),
                            lat: trackPoint["lat"].getFloat(),
                            lon: trackPoint["lon"].getFloat()
                        )
            else: discard

proc parseSqlEvents(file: string): seq[Event] =
    let data = readFile(file)
    let lines = data.split("\n")
    var inBlock = false
    for line in lines:
        if line.startsWith("COPY \"public\".\"events\""):
            inBlock = true
        if inBlock and line.startsWith("\\."):
            break
        let seqTabs = line.rsplit("\t")
        if inBlock and seqTabs.len > 1:
            let date = parse(seqTabs[1], "yyyy-MM-dd HH:mm:ss")
            let lat = parseFloat(seqTabs[2])
            let lon = parseFloat(seqTabs[3])
            result.add Event(
                created_at: date,
                lat: lat,
                lon: lon
            )

proc parseEvents*(file: string): seq[Event] =
    if file.endsWith(".json"):
        result = parseJsonEvents(file)
    if file.endsWith(".sql"):
        result = parseSqlEvents(file)

proc importEvents*(db: DbConn, events: seq[Event]) =
    for event in events:
        db.insert(event)

when isMainModule:
    let db = setupDb("db/")
    let events = parseEvents(paramStr(1))
    for i, event in events:
        if i mod 10 == 0:
            stdout.write("\r" & $i & "/" & $events.len)
            stdout.flushFile()
        try:
            db.insert(event)
        except: discard
