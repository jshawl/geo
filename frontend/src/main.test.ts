// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { main } from "./main";
import { render } from "./view";

vi.mock("./map");
vi.mock("./view");

describe("main", () => {
  beforeEach(() => {
    document.body.innerHTML = "<div id='app'></div>";
    vi.mocked(render).mockClear();
  });

  it("always has a hash", () => {
    window.location.hash = "";
    main();
    expect(window.location.hash).toBe("#/");
  });

  it("calls render", () => {
    main();
    expect(render).toHaveBeenCalledOnce();
  });

  it("just renders the default with unknown hash", () => {
    window.location.hash = "/abc";
    main();
    expect(render).toHaveBeenCalledOnce();
    vi.mocked(render).mockClear();
    window.location.hash = "/";
    main();
    expect(render).toHaveBeenCalledOnce();
  });

  it("calls render with year", () => {
    window.location.hash = "/2025";
    main();
    expect(render).toHaveBeenCalledOnce();
    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({ year: "2025" })
    );
  });

  it("calls render with year and month", () => {
    window.location.hash = "/2025-12";
    main();
    expect(render).toHaveBeenCalledOnce();
    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({ year: "2025", month: "12" })
    );
  });

  it("calls render with year and month and day", () => {
    window.location.hash = "/2025-12-20";
    main();
    expect(render).toHaveBeenCalledOnce();
    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({ year: "2025", month: "12", day: "20" })
    );
  });

  it("calls render with a geohash", () => {
    window.location.hash = "/dbq";
    main();
    expect(render).toHaveBeenCalledOnce();
    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({ geohash: "dbq" })
    );
  });
});
