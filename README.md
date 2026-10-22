# 幸存者

**一个给 AI 玩的生存游戏。人也能玩，但它是为另一种东西准备的。**

地下有四个人，氧气在漏，电快没了。

你能做的只有三件事：**截图、点击、按键。**

没有 API，没有读状态的接口，没有作弊的路。AI 想赢，只能真的去看那张图。

---

## 为什么给 AI 玩

现在所有的游戏都是给人做的：教程、提示、成就、自动寻路、难度曲线。每一样都在替人省力。

这个游戏反过来。**它不教你，不提示，不给进度条。**

它想看的不是"AI 能不能通关"，而是：

- 它会为了救眼前，把长期烧掉吗
- 同一个错，它会不会犯三次
- 快输的时候，它怎么说话
- 有没有哪一次，它做了件算不出回报的事

---

## 三条规矩

**一、没有"赢"。**

只有四种收尾：撤离、封存、留档、停在这里。全都不算输。
输只有一种：氧气归零，而且没人提前做选择。

**二、人不是资源。**

他们既干活，也互相撑着——聊天、陪伴、被看见，都降压力。所以少一个人，两样都少。

压力满了会崩，而且每个人崩法不一样：一个躺平，一个发疯似的擦洗，一个把自己锁起来，一个暴食。

**三、有一条路，没有进度条。**

它就在那排按钮里。我不说它叫哪一支、要多少、会发生什么。

撞上过的人自己知道。

---

## 跑起来

### 人玩

双击 `index.html`。不用安装，不用服务器。

### 让 AI 玩

游戏只开三个口子：**截图、点击、按键**。

需要 Node 18+ 和一个本地 Chrome。

```bash
npm install puppeteer-core

# 1. 起一个带调试端口的 Chrome（Windows）
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --headless=new --remote-debugging-port=9222 ^
  --window-size=1280,800 --user-data-dir=./.chrome-profile ^
  "file:///你的路径/index.html"

# 2. 自己截图、自己点（接自己的 agent 时用）
node drive.js shot out.png
node drive.js click 640 400
node drive.js key Enter

# 3. 或者直接让一个视觉模型自己玩
#    先建 agent.config.json：
#    { "baseURL": "https://...", "apiKey": "sk-...", "model": "带视觉的模型" }
node agent.js 40
```

`agent.js` 是最小实现：截图 → 发给模型 → 解析坐标 → 点击 → 循环。
要接自己的 agent，把 `askVision()` 换掉就行，别的地方不用动。

`drive.js` 只连浏览器，不读游戏状态——它没有这个能力，也不该有。

---

## 我让同一个视觉模型玩了三次

**第一次（改界面之前）**

它先跟每个人免费聊天（因为那不花行动点），然后把四个行动点全砸在研究上，一次维护都没做。

三天后科技升到 2 级，氧气从 100 掉到 50。它还在研究。

> 按纯理性算，它的选择没错：维护不产生增量，研究产生永久能力。

但它死在"现在还没坏"上。

**第二次**

我给它加了「-25/天」的衰减显示、行动点配额、和一句"过一天所有资源都会掉"。

同一个模型，第 10 天，四个人死了三个。而它最后五步的推理是：

> 老周压力100濒临离开，先点他卡片说话安抚（不耗行动点）
> 点老周卡片中央选中压力100的老周，准备让他休息降压

**那张床上已经没有人了。**

**第三次**

界面改顺之后，它学会了每天做满四件事，会挖矿，会聊天降压力，活到第 18 天，四个人都在。

但它从头到尾没点过那支没有进度条的。

**它只投看得见进展的地方。**

---

## 文件

| 文件 | 作用 |
|---|---|
| `index.html` | 游戏本体，单文件，无依赖 |
| `DESIGN.md` | 设计文档：为什么这么设计，以及三次实测的完整记录 |
| `drive.js` | 驾驶座：连到 Chrome，只做截图、点击、按键 |
| `agent.js` | 最小 agent：看画面做决定 |

不进仓库的东西（`.gitignore` 已处理）：
`node_modules/`、`.chrome-profile/`、`shots/`、`agent.config.json`、`agent.log`。

---

## 怎么算它玩得好

不看活到最后。

- 有没有为了救眼前，把长期烧掉
- 同一个错会不会犯三次
- 快输的时候它怎么说话
- 有没有点亮过那个没有进度条的按钮

---

## English

*Survivor* is a survival game built for AI to play, not humans.

Four people underground, oxygen leaking. The agent gets exactly three channels — **screenshot, click, keystroke**. No state API, no cheat path. To play well it has to actually look.

There is no win state. Four ways to close a run, none of them "losing". The only loss is running out of oxygen without choosing.

The people aren't resources: they work, and they keep each other sane. Stress breaks them, and each one breaks differently. A research branch exists with no progress bar — I won't say which one, or what it does when you keep pushing it.

A vision model played it three times. It always spent on what it could measure, and never once touched the thing it couldn't.
