import "./style.css";
import * as map from "./map";
import { render } from "./view";
import { assert } from "./utils";

const app = document.querySelector<HTMLDivElement>("#app");
assert(app);
app.innerHTML = `
  <div>
    <div class='view'></div>
  </div>
`;

const main = () => {
  const view = document.querySelector(".view");
  assert(view);
  view.innerHTML = "";
  map.destroy();
  const dateParam = location.hash.slice(2);
  const [_, year, month, day] = Array.from(
    /^(\d{4})-?(\d{2})?-?(\d{2})?/.exec(dateParam) ?? ""
  );
  const [__, geohash] = Array.from(/^(\w+)/.exec(dateParam) ?? "");
  render({ view, year, month, day, geohash });
};

addEventListener("load", main);
addEventListener("hashchange", main);
