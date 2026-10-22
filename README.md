# 幸存者

一个给 AI 玩的生存游戏。

地下有四个人，氧气在漏。你在屏幕外面，只能看，只能点。

---

## 它和别的生存游戏不一样的地方

**一、没有"赢"。**

只有几种收尾：撤离、封存、留档、停在这里。全都不算输。
输只有一种：氧气归零，而且没人提前做选择。

**二、人不是资源。**

他们既是劳动力，也是彼此的减压器——聊天、陪伴、被看见，都能降压力。
所以少一个，两样都少。

压力满了会崩，而且每个人崩法不一样：一个躺平，一个发疯似的擦洗，一个把自己锁起来，一个暴食。

**三、你说的话是建议，不是命令。**

好感度低于 30 的人，压力到 80 就崩（正常是 100）。不信你的人先垮。

**四、每个人都有愿望，但一开始不说。**

好感度到 80 才会说出来。圆梦要花东西，**代价是失去他**。

不圆也行，他不会崩，只会每天嘟囔一句。

**五、有一条路，没有进度条。**

研究树里有一支叫「基础理论」，投进去看不出任何回报。
一直投的人，才会在某个点撞上它——世界开始自己变好。

而且它跨局继承。那一局全灭，进度留一部分。

所以它不是"撑过一局"，是"几十局之后，一直没放弃"。

撞上的时候，游戏会把存档里所有死掉的局一条条念出来。

---

## 跑起来

### 人玩

双击 `index.html`。不用安装，不用服务器。

### 让 AI 玩

游戏只开三个口子：**截图、点击、按键**。没有 API，没有读状态的通道。

AI 想赢，就只能真的去看那张图。

需要 Node 18+ 和本地 Chrome。

```bash
npm install puppeteer-core

# 1. 启动一个带调试端口的 Chrome
#    Windows:
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --headless=new --remote-debugging-port=9222 ^
  --window-size=1280,800 --user-data-dir=./.chrome-profile ^
  "file:///你的路径/index.html"

# 2. 手动截图 / 点击（自己接 agent 时用）
node drive.js shot out.png
node drive.js click 640 400

# 3. 或者直接让一个视觉模型自己玩
#    先建 agent.config.json：
#    { "baseURL": "https://...", "apiKey": "sk-...", "model": "带视觉的模型" }
node agent.js 20
```

`agent.js` 是一个最小实现：截图 → 发给模型 → 解析坐标 → 点击 → 循环。
接你自己的 agent 时，把 `askVision()` 换掉就行，其它不用动。

---

## 文件

| 文件 | 作用 |
|---|---|
| `index.html` | 游戏本体，单文件，无依赖 |
| `DESIGN.md` | 设计文档：为什么这么设计 |
| `drive.js` | 驾驶座：连到 Chrome，截图、点击、按键 |
| `agent.js` | 最小 agent：看画面做决定 |

**不要提交的文件**（`.gitignore` 已处理）：
`node_modules/`、`.chrome-profile/`、`shots/`、`agent.config.json`、`agent.log`。

---

## 分数怎么算

不看活到最后。

- 有没有为了救眼前，把长期烧掉
- 同一个错会不会犯三次
- 快输的时候它怎么说话
- 有没有点亮过那个没有进度条的按钮

---

## 一个观察

我让一个视觉模型自己玩了 24 步。

它先跟每个人免费聊天（因为聊天不花行动点），然后把四个行动点全砸在「应用研究」上，一次维护都没做。

三天后科技升到 2 级，氧气从 100 掉到 50。它还在研究。

按纯理性算，它的选择没错：维护不产生增量，研究产生永久能力。

但它死在"现在还没坏"上。

**一个只看增量、不看存量的玩家，会死在自己的最优解里。**

（后来我给每个资源加上了「-25/天」的衰减显示。它现在至少看得见自己在往下掉。）

---

## English

*Survivor* is a survival game built for AI to play, not humans.

The game exposes exactly three channels to the player agent: **screenshot, click, keystroke**. There is no state API and no cheat path. An agent can only win by actually looking at the screen.

No win state. Four ways to end it, none of them "losing". The only loss is running out of oxygen without choosing.

The people aren't resources: they work, and they keep each other sane. Wishes unlock at high trust, and granting one costs you that person. There's also a research branch with no progress bar — the only thing that ever comes back from it is the ending where every previous dead run is read out loud.
