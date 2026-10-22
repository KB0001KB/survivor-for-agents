const puppeteer = require("puppeteer-core");
(async () => {
  const b = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
  const ps = await b.pages();
  const p = ps.find(x => x.url().includes("survival"));
  await p.evaluate(() => {
    G.res.water = 40;
    G.remedy = { text: "水管冻裂了，还在漏。", cost: { material: 8 }, give: { water: 6 } };
    render();
  });
  console.log("ok");
  await b.disconnect();
})();
