import "./style.css";
import * as map from "./map";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <div class='view'></div>
  </div>
`;
const view = document.querySelector(".view")!;
addEventListener("load", main);
addEventListener("hashchange", main);

const breadcrumbs = (strings: string[]) =>
  `<h2><a href='/#/'>~/</a> ` +
  strings
    .map((el, i, all) => {
      return `<a href='/#/${all.slice(0, i + 1).join("-")}'>${el}</a>`;
    })
    .join("-") +
  `</h2>`;

function main() {
  view.innerHTML = "";
  map.destroy();
  const dateParam = location.hash.slice(2);
  const [_, year, month, day] = Array.from(
    dateParam.match(/^(\d{4})-?(\d{2})?-?(\d{2})?/) ?? ""
  );

  type Count<T extends "year" | "month" | "day"> = { [K in T]: string } & {
    count: string;
  };

  if (year && month && day) {
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
    return;
  }

  if (year && month) {
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
    return;
  }

  if (year) {
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
    return;
  }

  map.render([]);
  updateMapFromUrl();
  map.addGeoHashes();
  map.addEventListener("move", () => {
    debounce(async () => {
      updateUrlFromMap();
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
}

let debounceTimeout: number;
function debounce(fn: Function) {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(fn, 500);
}

function updateUrlFromMap() {
  const values: Record<string, number> = {
    ...map.getCenter(),
    zoom: map.getZoom(),
  };
  const params = new URLSearchParams();
  for (let key in values) {
    params.append(key, `${values[key]}`);
  }
  window.history.pushState(null, "", "#/?" + params.toString());
}

function updateMapFromUrl() {
  const hasParams = /lat=/.test(location.hash);
  if (!hasParams) {
    return;
  }
  const params = new URLSearchParams(window.location.hash.slice(2));
  const [lat, lon, zoom] = ["lat", "lng", "zoom"].map((key) =>
    parseFloat(params.get(key) ?? "")
  );
  map.setView([lat, lon], zoom);
}
