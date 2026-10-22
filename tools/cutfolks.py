# 把外面来的图收拾成游戏能用的素材
#   1) 白底抠成透明（只抠和边缘连通的白，人物身上的白衬衫、白碗不动）
#   2) 按人物裁边
#   3) 统一缩放到 2 倍尺寸
import os, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
OUT = os.path.join(ASSETS, "folk")
os.makedirs(OUT, exist_ok=True)

IDS = ["ayan", "xiaoman", "shitou", "adou", "laozhou", "ading", "aque", "laohan"]


def cut_white(im, thresh=42):
    """从四角灌水，把连通的白色变透明。人物有深色描边挡着，里面的白不会漏。"""
    im = im.convert("RGBA")
    w, h = im.size
    for p in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        try:
            ImageDraw.floodfill(im, p, (0, 0, 0, 0), thresh=thresh)
        except Exception:
            pass
    return im


def trim(im, pad=6):
    box = im.getbbox()
    if not box:
        return im
    x0, y0, x1, y1 = box
    x0 = max(0, x0 - pad); y0 = max(0, y0 - pad)
    x1 = min(im.width, x1 + pad); y1 = min(im.height, y1 + pad)
    return im.crop((x0, y0, x1, y1))


def save(im, name, maxh=280):
    if im.height > maxh:
        k = maxh / im.height
        im = im.resize((max(1, round(im.width * k)), maxh), Image.LANCZOS)
    im.save(os.path.join(OUT, name), "PNG")
    print("  %-18s %dx%d" % (name, im.width, im.height))


def main():
    # --- 站立：八张单图 ---
    singles = sorted(
        [f for f in os.listdir(ASSETS) if f.startswith("ChatGPT") and f.endswith(".png")],
        key=lambda s: int(s.rsplit("-", 1)[1].split(".")[0]),
    )
    print("站立 %d 张" % len(singles))
    if len(singles) != 8:
        print("！数量不是 8，停下"); return
    for i, f in enumerate(singles):
        im = Image.open(os.path.join(ASSETS, f))
        im = trim(cut_white(im))
        save(im, IDS[i] + ".png")

    # --- 弯腰：一张合辑，2 行 4 列 ---
    sheet = os.path.join(ASSETS, "八人弯腰劳作角色图鉴.png")
    if os.path.exists(sheet):
        im = Image.open(sheet)
        W, H = im.size
        print("弯腰合辑 %dx%d" % (W, H))
        cw, ch = W // 4, H // 2
        for r in range(2):
            for c in range(4):
                cell = im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
                cell = trim(cut_white(cell), pad=4)
                save(cell, IDS[r * 4 + c] + "-work.png", maxh=260)


main()
