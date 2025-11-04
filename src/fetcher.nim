import httpclient, os
import db_connector/db_sqlite

type
  HttpGetProc* = proc(url: string): string {.closure.}
  
  DataFetcher* = ref object
    httpGet*: HttpGetProc
    url*: string

proc newDataFetcher*(httpGet: HttpGetProc, url: string): DataFetcher =
  DataFetcher(httpGet: httpGet, url: url)

proc fetchData*(f: DataFetcher): string =
  f.httpGet(f.url)

proc realHttpGet*(url: string): string =
  newHttpClient().getContent(url)

when isMainModule:
  let baseUrl: string = os.getEnv("BASE_URL")
  let fetcher: DataFetcher = newDataFetcher(realHttpGet, baseUrl)
  let result = fetchData(fetcher)
  echo "done:"
  echo result
  let db = open("mytest.db", "", "", "")
  db.exec(sql"CREATE TABLE IF NOT EXISTS items (id INTEGER, name TEXT)")

  for item in 1..10:
    db.exec(sql"INSERT INTO items VALUES (?, ?)", 
          item, "yay")

  db.close()