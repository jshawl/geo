import "./style.css";
import * as map from "./map";
import { render } from "./view";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <div class='view'></div>
  </div>
`;

const main = () => {
  const view = document.querySelector(".view")!;
  view.innerHTML = "";
  map.destroy();
  const dateParam = location.hash.slice(2);
  const [_, year, month, day] = Array.from(
    dateParam.match(/^(\d{4})-?(\d{2})?-?(\d{2})?/) ?? ""
  );
  const [__, geohash] = Array.from(dateParam.match(/^(\w+)/) ?? "");
  return render({ view, year, month, day, geohash });
};
addEventListener("load", main);
addEventListener("hashchange", main);
