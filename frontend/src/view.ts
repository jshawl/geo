import { debounce } from "./utils";
import * as map from "./map";

type Count<T extends "year" | "month" | "day"> = { [K in T]: string } & {
  count: string;
};

type ViewProps<T extends string> = {
  view: Element;
  year?: string;
  month?: string;
  day?: string;
} & { [K in T]: string };

const breadcrumbs = (strings: string[]) =>
  `<h2><a href='/#/'>~/</a> ` +
  strings
    .map((el, i, all) => {
      return `<a href='/#/${all.slice(0, i + 1).join("-")}'>${el}</a>`;
    })
    .join("-") +
  `</h2>`;

const renderDay = ({
  view,
  year,
  month,
  day,
}: ViewProps<"year" | "month" | "day">) => {
  view.innerHTML = breadcrumbs([year, month, day]);
  const now = new Date().toString();
  const tz = now.match(/GMT([^\s]{3})/)?.[1];
  const parsed = Date.parse(`${year}-${month}-${day}T00:00:00.000${tz}:00`);
  const from = new Date(parsed).toISOString();
  const to = new Date(parsed + 86400000).toISOString();
  const url = `/api?from=${from}&to=${to}`;
  fetch(url).then(async (response) => {
    const data = await response.json();
    if (data.length > 0) {
      map.render(data);
    } else {
      view.innerHTML += "No events found.";
    }
  });
};

const renderMonth = ({ view, year, month }: ViewProps<"year" | "month">) => {
  view.innerHTML = breadcrumbs([year, month]);
  const url = `/api/days?year=${year}&month=${month}`;
  fetch(url).then(async (response) => {
    const data = (await response.json()) as Count<"day">[];
    view.innerHTML += `<ul>
      ${data
        .map(
          ({ day, count }) =>
            `<li><a href='/#/${day}'>${day}</a> - ${count}</li>`
        )
        .join("")}
    </ul>`;
  });
};

const renderYear = ({ view, year }: ViewProps<"year">) => {
  view.innerHTML = breadcrumbs([year]);
  const url = `/api/months?year=${year}`;
  fetch(url).then(async (response) => {
    const data = (await response.json()) as Count<"month">[];
    view.innerHTML += `<ul>
      ${data
        .map(
          ({ month, count }) =>
            `<li><a href='/#/${month}'>${month}</a> - ${count}</li>`
        )
        .join("")}
    </ul>`;
  });
};

const renderYears = ({ view }: ViewProps<never>) => {
  map.render([]);
  map.updateMapFromUrl();
  map.addGeoHashes();
  map.addEventListener("move", () => {
    debounce(async () => {
      map.updateUrlFromMap();
      map.addGeoHashes();
    });
  });
  view.innerHTML = breadcrumbs([]);
  const url = `/api/years`;
  fetch(url).then(async (response) => {
    const data = (await response.json()) as Count<"year">[];
    view.innerHTML += `<ul>
      ${data
        .map(
          ({ year, count }) =>
            `<li><a href='/#/${year}'>${year}</a> - ${count.toLocaleString()}</li>`
        )
        .join("")}
    </ul>`;
  });
};

export const render = ({
  view,
  year,
  month,
  day,
}: ViewProps<"year" | "month" | "day">) => {
  if (year && month && day) {
    return renderDay({ view, year, month, day });
  }

  if (year && month) {
    return renderMonth({ view, year, month });
  }

  if (year) {
    return renderYear({ view, year });
  }

  return renderYears({ view });
};
