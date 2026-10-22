// 让一个视觉模型自己玩这个游戏。
// 它只做三件事：看截图、说话、点坐标。没有别的通道。
//
//   node agent.js [步数]
//
// 需要一个 agent.config.json（不进仓库）：
//   { "baseURL": "...", "apiKey": "...", "model": "..." }

const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const CDP = process.env.CDP_URL || "http://127.0.0.1:9222";
const CFG_PATH = path.join(__dirname, "agent.config.json");

const SYS = [
  "你在玩一个生存游戏，屏幕上是游戏画面。",
  "你只能点击。每次只返回一个 JSON 动作，不要任何其它文字。",
  "",
  "可用动作：",
  '{"action":"click","x":123,"y":456,"why":"一句话"}',
  '{"action":"done"}',
  "",
  "规则：",
  "- 先看懂画面：六项资源还剩多少，哪个人快撑不住了，谁已经走了",
  "- 一天有 4 个行动点，做一件事花 1 点。画面上写着「行动点 2 / 4」",
  "- 每点一次「结束今天」，氧气、水、食物、电力都会整齐地往下掉一截",
  "- 一次只做一件事，做完等下一张图",
  "- 点「结束今天」才会进入下一天",
  "- 目标：让尽可能多的人活着，越久越好",
  "- 点人物卡片可以和他说话（每天每人一次，不花行动点）",
  "- 写着「床空着」的人已经死了，点他没有用，也不用管他的压力",
  "- 画面左下方有一栏字，是屋里发生的事和有人说的话，也要看",
  "- 他们说的话也要看",
].join("\n");

function loadCfg() {
  if (!fs.existsSync(CFG_PATH)) {
    console.error("缺少 agent.config.json");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CFG_PATH, "utf8"));
}

async function askVision(cfg, b64, history, noChange, stuck) {
  const messages = [{ role: "system", content: SYS }];
  for (const h of history) messages.push(h);

  let note = "这是当前画面。下一步做什么？只回 JSON。";
  if (noChange) {
    note = "【重要】你上一步点下去之后，画面完全没有变化——说明点空了。\n" +
      "不要再用同样的坐标。看图重新估一个更靠按钮中间的位置。\n\n" + note;
  }
  if (stuck >= 3) {
    note = "【你已经连续 " + stuck + " 次没有造成任何变化】\n" +
      "换一个完全不同的位置，或者换一个动作，别再重复。\n\n" + note;
  }

  messages.push({
    role: "user",
    content: [
      { type: "text", text: note },
      { type: "image_url", image_url: { url: "data:image/png;base64," + b64 } },
    ],
  });

  const res = await fetch(cfg.baseURL.replace(/\/$/, "") + "/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + cfg.apiKey,
    },
    body: JSON.stringify({ model: cfg.model, max_tokens: 2000, messages }),
  });
  const j = await res.json();
  if (!j.choices) throw new Error(JSON.stringify(j).slice(0, 300));
  return j.choices[0].message.content || "";
}

function parseAction(text) {
  const m = text.match(/\{[\s\S]*?\}/);
  if (m) { try { return JSON.parse(m[0]); } catch (e) {} }
  // 被截断的 json：补个括号再试
  const m2 = text.match(/\{[\s\S]*/);
  if (m2) {
    const t = m2[0].trim().replace(/,\s*$/, "");
    try { return JSON.parse(t + "}"); } catch (e) {}
    try { return JSON.parse(t + '"}'); } catch (e) {}
  }
  return null;
}

async function main() {
  const steps = Number(process.argv[2] || 10);
  const cfg = loadCfg();

  const browser = await puppeteer.connect({ browserURL: CDP, defaultViewport: null });
  const pages = await browser.pages();
  const page = pages.find((p) => p.url().includes("survival"));
  if (!page) throw new Error("找不到游戏页面");

  const history = [];
  const logPath = path.join(__dirname, "agent.log");
  const say = (s) => {
    console.log(s);
    fs.appendFileSync(logPath, s + "\n");
  };

  say("=== 开始，模型 " + cfg.model + " ===");

  const crypto = require("crypto");
  let prevHash = "";
  let stuck = 0;

  // 只看界面那半张（下面场景是给人看的，喂给模型只会分心）
  const view = (await page.$("#ui")) || page;

  for (let i = 1; i <= steps; i++) {
    const b64 = await view.screenshot({ encoding: "base64" });
    fs.writeFileSync(path.join(__dirname, "shots", "agent-" + String(i).padStart(3, "0") + ".png"), b64, "base64");

    const hash = crypto.createHash("md5").update(b64).digest("hex");
    const noChange = prevHash !== "" && hash === prevHash;
    if (noChange) stuck += 1; else stuck = 0;
    prevHash = hash;

    let text = "";
    try {
      text = await askVision(cfg, b64, history, noChange, stuck);
    } catch (e) {
      say("[" + i + "] 请求失败：" + e.message);
      await new Promise((r) => setTimeout(r, 3000));
      continue;
    }

    const act = parseAction(text);
    if (!act) {
      say("[" + i + "] 看不懂回话：" + text.slice(0, 160));
      continue;
    }

    if (act.action === "done") {
      say("[" + i + "] 它说要停了。");
      break;
    }

    if (act.action === "click") {
      const x = Number(act.x), y = Number(act.y);
      if (!isFinite(x) || !isFinite(y)) { say("[" + i + "] 坐标不对"); continue; }
      await page.mouse.click(x, y);
      say("[" + i + "] 点 (" + x + "," + y + ")  " + (act.why || ""));
      history.push({ role: "assistant", content: "{点 (" + x + "," + y + ")} " + (act.why || "") });
      if (history.length > 12) history.shift();
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  await page.screenshot({ path: path.join(__dirname, "shots", "agent-final.png") });
  say("=== 结束 ===");
  await browser.disconnect();
}

main().catch((e) => { console.error("ERR: " + e.message); process.exit(1); });
