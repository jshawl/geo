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
    dateParam.match(/(\d{4})-?(\d{2})?-?(\d{2})?/) ?? ""
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

  const url = `/api/years`;
  view.innerHTML = breadcrumbs([]);
  fetch(url).then(async (response) => {
    const data = (await response.json()) as Count<"year">[];
    view.innerHTML += `<ul>
      ${data
        .map(
          ({ year, count }) =>
            `<li><a href='/#/${year}'>${year}</a> - ${count}</li>`
        )
        .join("")}
    </ul>`;
  });
}
