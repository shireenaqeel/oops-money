# make_icons.py — one-off: turn the cat+money-bag screenshot into all the app icon assets.
from PIL import Image, ImageChops

SRC = r"C:\Users\SHREEN\OneDrive\Desktop\Screenshot 2026-06-17 002336.png"
ASSETS = r"D:\oops-money-tracker\assets"

S = 1024  # standard icon size

def trim(im):
    """Crop away the uniform/transparent border around the icon art."""
    im = im.convert("RGBA")
    alpha = im.split()[3]
    bbox = alpha.getbbox()  # bounds of non-transparent pixels
    if bbox and (bbox[2] - bbox[0]) > 10:
        return im.crop(bbox)
    # no real transparency -> trim using the top-left corner colour
    bg = Image.new("RGBA", im.size, im.getpixel((0, 0)))
    diff = ImageChops.difference(im, bg)
    bbox = diff.getbbox()
    return im.crop(bbox) if bbox else im

def edge_color(art, y_frac):
    """Average opaque pixels across a horizontal line -> a gradient endpoint colour."""
    w, h = art.size
    y = max(0, min(h - 1, int(h * y_frac)))
    px = art.load()
    rs = gs = bs = n = 0
    for x in range(0, w, max(1, w // 64)):
        r, g, b, a = px[x, y]
        if a > 200:
            rs += r; gs += g; bs += b; n += 1
    if n == 0:
        return (244, 198, 223)
    return (rs // n, gs // n, bs // n)

def gradient(top, bottom, size=S):
    """Vertical gradient image from top colour to bottom colour."""
    g = Image.new("RGB", (size, size))
    px = g.load()
    for y in range(size):
        t = y / (size - 1)
        c = tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        for x in range(size):
            px[x, y] = c
    return g

def fit(art, target, scale):
    """Scale art to `scale` of target box, return a square transparent canvas with it centred."""
    w, h = art.size
    box = int(target * scale)
    r = min(box / w, box / h)
    art2 = art.resize((max(1, int(w * r)), max(1, int(h * r))), Image.LANCZOS)
    canvas = Image.new("RGBA", (target, target), (0, 0, 0, 0))
    canvas.paste(art2, ((target - art2.width) // 2, (target - art2.height) // 2), art2)
    return canvas

def cover(art, target):
    """Scale art to FILL the square (crop overflow) — full-bleed."""
    w, h = art.size
    r = max(target / w, target / h)
    art2 = art.resize((max(1, int(w * r)), max(1, int(h * r))), Image.LANCZOS)
    canvas = Image.new("RGBA", (target, target), (0, 0, 0, 0))
    canvas.paste(art2, ((target - art2.width) // 2, (target - art2.height) // 2), art2)
    return canvas

art = trim(Image.open(SRC))
top = edge_color(art, 0.10)
bottom = edge_color(art, 0.90)
print("gradient", top, "->", bottom)

# 1) main icon — full-bleed square: gradient background + art filling it (cover)
bg = gradient(top, bottom).convert("RGBA")
icon = Image.alpha_composite(bg, cover(art, S))
icon.convert("RGB").save(ASSETS + r"\icon.png")

# 2) android adaptive foreground — full-bleed art so the squircle mask cuts cleanly and
#    the matching gradient background shows through the rounded corners seamlessly
icon.save(ASSETS + r"\android-icon-foreground.png")

# 3) android adaptive background — the gradient
gradient(top, bottom).save(ASSETS + r"\android-icon-background.png")

# 4) splash icon — art centred on transparent
fit(art, S, 0.6).save(ASSETS + r"\splash-icon.png")

# 5) favicon — small
icon.convert("RGB").resize((48, 48), Image.LANCZOS).save(ASSETS + r"\favicon.png")

print("done")
