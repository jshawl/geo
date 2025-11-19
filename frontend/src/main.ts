import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Vite + TypeScript</h1>
    <pre></pre>
  </div>
`;

const dateParam = location.hash.slice(1);
const pre = document.querySelector("pre")!;

if (!dateParam) {
  const url = `/api/years`;
  fetch(url).then(async (response) => {
    const data = await response.json();
    pre.innerHTML = JSON.stringify(data, null, 2);
  });
}

if (dateParam) {
  const now = new Date().toString();
  const tz = now.match(/GMT([^\s]{3})/)?.[1];
  const parsed = Date.parse(`${dateParam}T00:00:00.000${tz}:00`);
  const from = new Date(parsed).toISOString();
  const to = new Date(parsed + 86400000).toISOString();
  const url = `/api?from=${from}&to=${to}`;
  fetch(url).then(async (response) => {
    const data = await response.json();
    pre.innerHTML = JSON.stringify(data, null, 2);
  });
  console.log({ url });
}
