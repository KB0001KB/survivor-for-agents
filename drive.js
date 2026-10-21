// 驾驶座：连到已经开着的 Chrome，只看画面、只点坐标。
// 没有读取游戏状态的接口。
//
//   node drive.js shot <out.png>
//   node drive.js click <x> <y>
//   node drive.js key <key>
//   node drive.js size
//   node drive.js url

const puppeteer = require("puppeteer-core");

const CDP = process.env.CDP_URL || "http://127.0.0.1:9222";

async function main() {
  const [cmd, a, b] = process.argv.slice(2);
  const browser = await puppeteer.connect({ browserURL: CDP, defaultViewport: null });
  try {
    const pages = await browser.pages();
    const page = pages.find((p) => p.url().includes("survival")) || pages[0];
    if (!page) throw new Error("no page");

    if (cmd === "shot") {
      const out = a || "shot.png";
      await page.screenshot({ path: out });
      console.log("shot -> " + out);
    } else if (cmd === "click") {
      await page.mouse.click(Number(a), Number(b));
      console.log("click " + a + "," + b);
    } else if (cmd === "key") {
      await page.keyboard.press(a);
      console.log("key " + a);
    } else if (cmd === "size") {
      const dim = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
      console.log(JSON.stringify(dim));
    } else if (cmd === "url") {
      console.log(page.url());
    } else if (cmd === "reload") {
      await page.reload({ waitUntil: "load" });
      console.log("reloaded");
    } else if (cmd === "clear") {
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: "load" });
      console.log("save cleared");
    } else if (cmd === "seed") {
      // 仅用于开发测试：从文件读一条存档塞进去
      const fs = require("fs");
      const raw = fs.readFileSync(a === undefined ? "seed.json" : a, "utf8");
      await page.evaluate((s) => localStorage.setItem("survival.save.v1", s), raw);
      await page.reload({ waitUntil: "load" });
      console.log("seeded: " + raw.slice(0, 80));
    } else {
      console.log("usage: shot|click|key|size|url");
    }
  } finally {
    await browser.disconnect();
  }
}

main().catch((e) => {
  console.error("ERR: " + e.message);
  process.exit(1);
});
