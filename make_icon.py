# Generates Oops Money app icons - dreamy pastel Ghibli bg + quirky handwritten text
from PIL import Image, ImageDraw, ImageFont, ImageFilter

S = 1024
FONT_HAND = "C:/Windows/Fonts/segoeprb.ttf"   # Segoe Print Bold (quirky handwriting)

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def multi_gradient(size, stops):
    col = Image.new("RGB", (1, size))
    for y in range(size):
        t = y / (size - 1)
        for i in range(len(stops) - 1):
            p0, c0 = stops[i]; p1, c1 = stops[i + 1]
            if p0 <= t <= p1:
                lt = (t - p0) / (p1 - p0) if p1 > p0 else 0
                col.putpixel((0, y), lerp(c0, c1, lt)); break
        else:
            col.putpixel((0, y), stops[-1][1])
    return col.resize((size, size))

def soft_cloud(layer, cx, cy, scale, alpha):
    d = ImageDraw.Draw(layer)
    for dx, dy, r in [(-1.6,0.1,0.7),(-0.8,-0.4,0.95),(0,-0.55,1.05),
                      (0.9,-0.35,0.95),(1.7,0.1,0.72),(0,0.25,1.25)]:
        rr = r*scale; x = cx+dx*scale; y = cy+dy*scale
        d.ellipse((x-rr,y-rr,x+rr,y+rr), fill=(255,255,255,alpha))

def sparkle(d, cx, cy, r, color):
    d.polygon([(cx,cy-r),(cx+r*0.18,cy-r*0.18),(cx+r,cy),(cx+r*0.18,cy+r*0.18),
               (cx,cy+r),(cx-r*0.18,cy+r*0.18),(cx-r,cy),(cx-r*0.18,cy-r*0.18)], fill=color)

def dreamy_bg():
    sky = multi_gradient(S, [
        (0.00,(168,216,234)),  # sky blue
        (0.45,(192,220,240)),  # powder blue
        (0.75,(224,238,248)),  # pale blue
        (1.00,(253,246,250)),  # cream
    ]).convert("RGBA")
    # soft sun glow (subtle, upper area)
    glow = Image.new("RGBA",(S,S),(0,0,0,0))
    ImageDraw.Draw(glow).ellipse((S*0.34,S*0.06,S*0.66,S*0.34), fill=(255,255,255,95))
    sky.alpha_composite(glow.filter(ImageFilter.GaussianBlur(70)))
    # clouds
    clouds = Image.new("RGBA",(S,S),(0,0,0,0))
    soft_cloud(clouds,S*0.20,S*0.20,52,185)
    soft_cloud(clouds,S*0.83,S*0.26,46,165)
    soft_cloud(clouds,S*0.14,S*0.80,50,160)
    soft_cloud(clouds,S*0.86,S*0.78,44,150)
    sky.alpha_composite(clouds.filter(ImageFilter.GaussianBlur(6)))
    # sparkles
    sp = Image.new("RGBA",(S,S),(0,0,0,0)); spd = ImageDraw.Draw(sp)
    for x,y,r in [(0.16,0.34,15),(0.84,0.40,13),(0.30,0.66,11),(0.72,0.70,12),
                  (0.50,0.16,12),(0.20,0.50,8),(0.80,0.58,9)]:
        sparkle(spd,S*x,S*y,r,(255,255,255,235))
    sky.alpha_composite(sp.filter(ImageFilter.GaussianBlur(1)))
    return sky

def draw_wordmark(img, max_w, cy):
    """Draw stacked quirky 'oops' / 'money' with soft white glow halo + blue text."""
    d = ImageDraw.Draw(img)
    size = 300
    while size > 40:
        f = ImageFont.truetype(FONT_HAND, size)
        w1 = d.textbbox((0,0),"oops",font=f)
        w2 = d.textbbox((0,0),"money",font=f)
        if (w1[2]-w1[0]) <= max_w and (w2[2]-w2[0]) <= max_w:
            break
        size -= 6
    f = ImageFont.truetype(FONT_HAND, size)
    gap = int(size*0.18)
    lines = ["oops","money"]
    dims = [d.textbbox((0,0),t,font=f) for t in lines]
    heights = [b[3]-b[1] for b in dims]
    total = sum(heights)+gap

    # render text to its own layer for a soft white halo
    txt = Image.new("RGBA",(S,S),(0,0,0,0))
    td = ImageDraw.Draw(txt)
    y = cy - total/2
    placed = []
    for t,b in zip(lines,dims):
        w = b[2]-b[0]; x = S/2 - w/2 - b[0]; yy = y - b[1]
        placed.append((t,x,yy)); y += (b[3]-b[1]) + gap

    # white halo (glow behind text)
    halo = Image.new("RGBA",(S,S),(0,0,0,0))
    hd = ImageDraw.Draw(halo)
    for t,x,yy in placed:
        hd.text((x,yy),t,font=f,fill=(255,255,255,255))
    halo = halo.filter(ImageFilter.GaussianBlur(10))
    img.alpha_composite(halo); img.alpha_composite(halo)  # double for strength

    # crisp soft-blue text on top
    for t,x,yy in placed:
        td.text((x,yy),t,font=f,fill=(94,127,168,255))   # soft slate blue
    img.alpha_composite(txt)

# 1. icon.png - full scene + wordmark
icon = dreamy_bg()
draw_wordmark(icon, int(S*0.78), S*0.52)
icon.convert("RGB").save("D:/oops-money-tracker/assets/icon.png")

# 2. android background - just the dreamy scene
dreamy_bg().convert("RGB").save("D:/oops-money-tracker/assets/android-icon-background.png")

# 3. android foreground - wordmark only, within safe zone (transparent)
fg = Image.new("RGBA",(S,S),(0,0,0,0))
draw_wordmark(fg, int(S*0.60), S*0.50)
fg.save("D:/oops-money-tracker/assets/android-icon-foreground.png")

# 4. splash - scene + wordmark
sp = dreamy_bg()
draw_wordmark(sp, int(S*0.70), S*0.52)
sp.save("D:/oops-money-tracker/assets/splash-icon.png")

print("done")
