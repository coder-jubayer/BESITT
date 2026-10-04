from PIL import Image
from pathlib import Path

root = Path(r"F:\WORKSPACE\MEGA PROJECTS\BUILDING MANAGMENT")
src = Image.open(root / "no background logo.png").convert("RGBA")
assets = root / "mobile" / "assets"
assets.mkdir(exist_ok=True)


def trim(im, alpha_thresh=8):
    a = im.split()[-1]
    bbox = a.point(lambda p: 255 if p > alpha_thresh else 0).getbbox()
    if bbox:
        return im.crop(bbox)
    rgb = im.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    left, top, right, bottom = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if r < 250 or g < 250 or b < 250:
                found = True
                left = min(left, x)
                top = min(top, y)
                right = max(right, x)
                bottom = max(bottom, y)
    if found and right > left and bottom > top:
        return im.crop((left, top, right + 1, bottom + 1))
    return im


def fit_on_canvas(fg, size, scale=0.72, bg=(0, 0, 0, 255)):
    canvas = Image.new("RGBA", (size, size), bg)
    max_side = int(size * scale)
    ratio = min(max_side / fg.width, max_side / fg.height)
    nw, nh = max(1, int(fg.width * ratio)), max(1, int(fg.height * ratio))
    resized = fg.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (size - nw) // 2
    y = (size - nh) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas


logo = trim(src)
print("source", src.size, "trimmed", logo.size)

icon = fit_on_canvas(logo, 1024, scale=0.78, bg=(0, 0, 0, 255))
icon.convert("RGB").save(assets / "icon.png", "PNG", optimize=True)

splash = fit_on_canvas(logo, 1024, scale=0.62, bg=(0, 0, 0, 255))
splash.convert("RGB").save(assets / "splash-icon.png", "PNG", optimize=True)

fg = fit_on_canvas(logo, 1024, scale=0.58, bg=(0, 0, 0, 0))
fg.save(assets / "android-icon-foreground.png", "PNG", optimize=True)

Image.new("RGB", (1024, 1024), (0, 0, 0)).save(
    assets / "android-icon-background.png", "PNG", optimize=True
)

mono_base = fit_on_canvas(logo, 1024, scale=0.58, bg=(0, 0, 0, 0))
pixels = mono_base.load()
for y in range(mono_base.height):
    for x in range(mono_base.width):
        r, g, b, a = pixels[x, y]
        if a > 20:
            lum = int(0.299 * r + 0.587 * g + 0.114 * b)
            v = 255 if lum > 40 or a > 200 else 0
            pixels[x, y] = (v, v, v, a if v else 0)
mono_base.save(assets / "android-icon-monochrome.png", "PNG", optimize=True)

in_app = fit_on_canvas(logo, 1024, scale=0.9, bg=(0, 0, 0, 0))
opaque = [(r, g, b, a) for r, g, b, a in in_app.getdata() if a > 20]
avg = sum((r + g + b) / 3 for r, g, b, a in opaque) / len(opaque) if opaque else 128
print("in-app avg luma", round(avg, 1))
if avg > 160:
    px = in_app.load()
    for y in range(in_app.height):
        for x in range(in_app.width):
            r, g, b, a = px[x, y]
            if a > 10:
                px[x, y] = (255 - r, 255 - g, 255 - b, a)
in_app.save(assets / "logo.png", "PNG", optimize=True)

fit_on_canvas(logo, 48, scale=0.85, bg=(0, 0, 0, 255)).convert("RGB").save(
    assets / "favicon.png", "PNG"
)

print("done")
for p in sorted(assets.glob("*")):
    print(p.name, p.stat().st_size)
