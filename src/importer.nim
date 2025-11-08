import std / [json, times]

type
  Event = object
    time: DateTime
    lat, lon: float

proc parseTime(time: string): DateTime =
    parse(time, "yyyyMMdd'T'HHmmssZZZ")

proc parseEvents*(file: string): seq[Event] =
    let data = parseFile(file)
    for entry in data:
        for segment in entry["segments"]:
            case segment["type"].getStr()
            of "place":
                result.add Event(
                    time: parseTime(segment["startTime"].getStr()),
                    lat: segment["place"]["location"]["lat"].getFloat(),
                    lon: segment["place"]["location"]["lon"].getFloat()
                )
            of "move":
                for activity in segment["activities"]:
                    for trackPoint in activity["trackPoints"]:
                        result.add Event(
                            time: parseTime(trackPoint["time"].getStr()),
                            lat: trackPoint["lat"].getFloat(),
                            lon: trackPoint["lon"].getFloat()
                        )
            else: discard
