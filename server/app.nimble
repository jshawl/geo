# Package

version       = "0.1.0"
author        = "Jesse Shawl"
description   = "A new awesome nimble package"
license       = "MIT"
srcDir        = "src"
bin           = @["worker", "server"]
binDir        = "build"


# Dependencies

requires "nim >= 2.2.6"

requires "db_connector >= 0.1.0"
