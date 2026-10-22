// 验四种收尾，加上重新开始和取消。跑完可以删。
const puppeteer = require("puppeteer-core");
const CDP = process.env.CDP_URL || "http://127.0.0.1:9222";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let page;

async function open() {
  const b = await puppeteer.connect({ browserURL: CDP, defaultViewport: null });
  const pages = await b.pages();
  page = pages.find((p) => p.url().includes("survival"));
  if (!page) throw new Error("找不到游戏页面");
  return b;
}
const ev = (fn, ...a) => page.evaluate(fn, ...a);

async function reset(theoryTotal) {
  await ev((n) => {
    localStorage.removeItem("survival.run.v1");
    localStorage.setItem("survival.save.v1", JSON.stringify({
      theoryTotal: n, awakened: false,
      runs: [{ day: 9, dead: 3, why: "全灭了" }],
    }));
  }, theoryTotal === undefined ? 3 : theoryTotal);
  await page.reload({ waitUntil: "load" });
  await sleep(350);
}

const snap = () => ev(() => ({
  day: G.day,
  over: G.over,
  power: Math.round(G.res.power),
  mat: Math.round(G.res.material),
  title: document.getElementById("over-title").textContent || "-",
  shown: document.getElementById("over").classList.contains("show"),
  msg: document.getElementById("choiceMsg").textContent,
  runs: G.runs.length,
  total: G.theoryTotal,
  lastRun: G.runs.length ? JSON.stringify(G.runs[G.runs.length - 1]) : "-",
}));

function show(label, s) {
  console.log(
    label.padEnd(18),
    "over=" + String(s.over).padEnd(5),
    "框=" + String(s.shown).padEnd(5),
    "电=" + String(s.power).padEnd(4),
    "材=" + String(s.mat).padEnd(4),
    "runs=" + s.runs,
    "总笔记=" + s.total,
    "| " + s.title
  );
  if (s.msg) console.log("   ↳ 提示：" + s.msg);
}

const H = (s) => console.log("\n=== " + s + " ===");

async function main() {
  const b = await open();

  H("撤离：电 10 / 材 10（不够 40/60）");
  await reset();
  await ev(() => { G.res.power = 10; G.res.material = 10; chooseEnding("evac"); });
  show("撤离/不够", await snap());

  H("撤离：电 100 / 材 200（够）");
  await reset();
  await ev(() => { G.res.power = 100; G.res.material = 200; chooseEnding("evac"); });
  const a = await snap();
  show("撤离/够", a);
  console.log("   ↳ 记录：" + a.lastRun);

  H("封存：电 30（不够 60）");
  await reset();
  await ev(() => { G.res.power = 30; chooseEnding("seal"); });
  show("封存/不够", await snap());

  H("封存：电 100（够）");
  await reset();
  await ev(() => { G.res.power = 100; chooseEnding("seal"); });
  const c = await snap();
  show("封存/够", c);
  console.log("   ↳ 记录：" + c.lastRun);

  H("留档：无要求");
  await reset();
  await ev(() => chooseEnding("log"));
  const d = await snap();
  show("留档", d);
  console.log("   ↳ 记录：" + d.lastRun);

  H("停在这里：无要求");
  await reset();
  await ev(() => chooseEnding("stop"));
  const e = await snap();
  show("停在这里", e);
  console.log("   ↳ 记录：" + e.lastRun);

  H("算了继续：面板关掉，游戏继续");
  await reset();
  await ev(() => { document.getElementById("choice").classList.add("show"); chooseEnding("cancel"); });
  const f = await snap();
  show("取消", f);
  console.log("   ↳ 面板还开着吗：" +
    await ev(() => document.getElementById("choice").classList.contains("show")));

  H("重新开始这一局：应该是全新的一天一");
  await reset();
  await ev(() => { G.day = 7; chooseEnding("restart"); });
  await sleep(1400);
  const g = await snap();
  show("重开之后", g);

  H("都走了：四个人全圆梦离开");
  await reset();
  await ev(() => {
    G.survivors.forEach((p) => { p.alive = false; p.left = true; });
    nextDay();
  });
  const h = await snap();
  show("都走了", h);
  console.log("   ↳ 记录：" + h.lastRun + "  （应该是 dead:0）");

  H("两走两死：结局是全灭，但只死了两个");
  await reset();
  await ev(() => {
    G.survivors[0].left = true; G.survivors[0].alive = false;
    G.survivors[1].left = true; G.survivors[1].alive = false;
    G.survivors[2].alive = false;
    G.survivors[3].alive = false;
    nextDay();
  });
  const i2 = await snap();
  show("两走两死", i2);
  console.log("   ↳ 记录：" + i2.lastRun + "  （应该是 dead:2）");

  await b.disconnect();
}

main().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
