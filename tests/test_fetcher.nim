import ../src/fetcher
import unittest

proc createMockGet(response: string): proc(url: string): string =
  return proc(url: string): string = response

test "fetchData works":
  let mockGet = createMockGet(readFile("tests/response.json"))
  let fetcher = DataFetcher(httpGet: mockGet, url: "http://test")
  check fetcher.fetchData() == "{ \"status\": \"ok\" }\n"