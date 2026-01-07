import { assert } from "./utils";
import * as map from "./map";

export type Count<T extends "year" | "month" | "day"> = Record<T, string> & {
  count: string;
};

type ViewProps<T extends string> = {
  view: Element;
  year?: string;
  month?: string;
  day?: string;
  geohash?: string;
} & Record<T, string>;

export const breadcrumbs = (strings: string[]) =>
  `<h2><a href='/#/'>~/</a> ` +
  strings
    .map((el, i, all) => {
      return `<a href='/#/${all.slice(0, i + 1).join("-")}'>${el}</a>`;
    })
    .join("-") +
  `</h2>`;

const renderDay = async ({
  view,
  year,
  month,
  day,
}: ViewProps<"year" | "month" | "day">) => {
  view.innerHTML = breadcrumbs([year, month, day]);
  const now = new Date().toString();
  const tz = /GMT([^\s]{3})/.exec(now)?.[1];
  assert(tz);
  const parsed = Date.parse(`${year}-${month}-${day}T00:00:00.000${tz}:00`);
  const from = new Date(parsed).toISOString();
  const to = new Date(parsed + 86400000).toISOString();
  const url = `/api?from=${from}&to=${to}`;
  const response = await fetch(url);
  const data = (await response.json()) as map.Event[];
  if (data.length > 0) {
    map.render(data, {
      polyline: !location.hash.includes("polyline=false"),
    });
  } else {
    view.innerHTML += "No events found.";
  }
};

const renderMonth = async ({
  view,
  year,
  month,
}: ViewProps<"year" | "month">) => {
  view.innerHTML = breadcrumbs([year, month]);
  const url = `/api/days?year=${year}&month=${month}`;
  const response = await fetch(url);
  const data = (await response.json()) as Count<"day">[];
  view.innerHTML += `<ul>
      ${data
        .map(
          ({ day, count }) =>
            `<li><a href='/#/${day}'>${day}</a> - ${count}</li>`
        )
        .join("")}
    </ul>`;
};

const renderYear = async ({ view, year }: ViewProps<"year">) => {
  view.innerHTML = breadcrumbs([year]);
  const url = `/api/months?year=${year}`;
  const response = await fetch(url);
  const data = (await response.json()) as Count<"month">[];
  view.innerHTML += `<ul>
      ${data
        .map(
          ({ month, count }) =>
            `<li><a href='/#/${month}'>${month}</a> - ${count}</li>`
        )
        .join("")}
    </ul>`;
};

const renderYears = async ({ view }: ViewProps<never>) => {
  map.render([]);
  // TODO map should reset center and zoom
  map.whenLoaded(() => {
    map.updateMapFromUrl();
    void map.addGeoHashes();
  });
  view.innerHTML = breadcrumbs([]);
  const url = `/api/years`;
  const response = await fetch(url);
  const data = (await response.json()) as Count<"year">[];
  view.innerHTML += `<ul>
      ${data
        .map(
          ({ year, count }) =>
            `<li><a href='/#/${year}'>${year}</a> - ${count.toLocaleString()}</li>`
        )
        .join("")}
    </ul>`;
};

const renderEvents = async ({ view, geohash }: ViewProps<"geohash">) => {
  view.innerHTML = breadcrumbs([]);

  const url = `/api?geohash=${geohash}`;
  const response = await fetch(url);
  const data = (await response.json()) as map.Event[];
  if (data.length > 0) {
    map.render(data, { polyline: false });
  } else {
    view.innerHTML += "No events found.";
  }
};

export const render = async ({
  view,
  year,
  month,
  day,
  geohash,
}: ViewProps<"year" | "month" | "day" | "geohash">) => {
  if (year && month && day) {
    return renderDay({ view, year, month, day });
  }

  if (year && month) {
    return renderMonth({ view, year, month });
  }

  if (year) {
    return renderYear({ view, year });
  }

  if (geohash) {
    return renderEvents({ view, geohash });
  }

  return renderYears({ view });
};
