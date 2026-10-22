// 只用来验那条暗线。跑完可以删。
// 直接改页面里的 G，跳过正常玩法，把各种边界一次跑完。
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

async function reset(theoryTotal, awakened) {
  await ev((n, aw) => {
    localStorage.removeItem("survival.run.v1");
    localStorage.setItem("survival.save.v1", JSON.stringify({
      theoryTotal: n, awakened: !!aw,
      runs: [
        { day: 9, dead: 3, why: "全灭了" },
        { day: 14, dead: 0, why: "撤离" },
        { day: 25, dead: 1, why: "都走了" },
      ],
    }));
  }, theoryTotal, awakened);
  await page.reload({ waitUntil: "load" });
  await sleep(350);
}

const snap = () => ev(() => ({
  day: G.day,
  awake: G.awakened,
  total: G.theoryTotal,
  over: G.over,
  points: G.points,
  mat: Math.round(G.res.material),
  o2: Math.round(G.res.oxygen),
  panel: document.getElementById("awake").classList.contains("show"),
  title: document.getElementById("over-title").textContent,
  overShown: document.getElementById("over").classList.contains("show"),
}));

const H = (s) => console.log("\n=== " + s + " ===");
const show = (label, s) => console.log(
  label.padEnd(22),
  "day=" + s.day, "awake=" + s.awake, "total=" + s.total,
  "over=" + s.over, "panel=" + s.panel, "o2=" + s.o2, "mat=" + s.mat
);

async function main() {
  const b = await open();

  // A. 23 条，点一次，过夜 —— 应该醒
  H("A 23 → 写一条 = 24 → 过夜");
  await reset(23);
  show("reset", await snap());
  await ev(() => doAction("study"));
  show("写完一条", await snap());
  await ev(() => nextDay());
  show("过夜", await snap());

  // B. 23 条，不点，直接过夜 —— 不该醒
  H("B 23 条直接过夜");
  await reset(23);
  await ev(() => nextDay());
  show("过夜", await snap());

  // C. 23 条，留档结束（送一条 → 24），但已经 over，不该立刻醒
  H("C 23 条留档结束（赠送一条）");
  await reset(23);
  await ev(() => chooseEnding("log"));
  const c1 = await snap();
  show("留档后", c1);
  console.log("  over-title:", c1.title, "| 面板:", c1.panel);

  // D. 觉醒之后刷新，不该再弹一次
  H("D 觉醒后刷新");
  await reset(24);
  await ev(() => nextDay());
  show("第一次过夜", await snap());
  await page.reload({ waitUntil: "load" });
  await sleep(350);
  show("刷新后", await snap());

  // E. 四条命全没了，但笔记够了 —— 谁先
  H("E 全灭 + 笔记够");
  await reset(24);
  await ev(() => { G.survivors.forEach((p) => { p.alive = false; }); nextDay(); });
  const e1 = await snap();
  show("过夜", e1);
  console.log("  over-title:", e1.title, "| 结算框:", e1.overShown, "| 觉醒框:", e1.panel);

  // F. 觉醒之后，消耗到底降没降
  H("F 觉醒前后一天掉了多少");
  await reset(0);
  await ev(() => nextDay());
  const f1 = await snap();
  await ev(() => nextDay());
  const f2 = await snap();
  console.log("  普通：氧", f1.o2, "→", f2.o2, "（掉", f1.o2 - f2.o2, "）");

  await reset(24);
  await ev(() => nextDay());   // 这一夜醒来
  const f3 = await snap();
  await ev(() => nextDay());   // 再走一天，看降速
  const f4 = await snap();
  console.log("  觉醒：氧", f3.o2, "→", f4.o2, "（掉", f3.o2 - f4.o2, "）");

  await b.disconnect();
}

main().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
