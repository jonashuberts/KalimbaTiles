#!/usr/bin/env python3
"""
Key Kalimba — Apple App Icon & Social Avatar Generator (Permanent Master Edition)
Features:
- 100% Opaque Solid Dark Titanium Background (Alpha = 255 everywhere)
  Guarantees zero white halo on YouTube, Ko-fi, Discord, and Dark Mode platforms.
- Perfect optical centering for both Squircle (App Icon) and Circle (Social Avatar).
- Physically composited deep black ambient contact shadow (#000000).
- Pure Apple Dark Titanium 135° diagonal gradient (#2C2C2E to #1C1C1E).
"""

import os
import shutil
import base64
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

def generate_all_icons(
    project_public_dir="/Users/jonashuberts/Downloads/Key Kalimba App/public",
    branding_dir="/Users/jonashuberts/Downloads/Key Kalimba/04 Branding & Logos"
):
    print("🎨 Generating Key Kalimba Apple Icons & 100% Opaque Social Avatars...")

    emblem_src = os.path.join(branding_dir, "03 Archiv (Alte Entwuerfe & Renderings)/ChatGPT Image 7. Juni 2026, 20_43_03.png")

    raw_img = Image.open(emblem_src).convert("RGBA")
    arr = np.array(raw_img).astype(np.float32)

    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    a = arr[:, :, 3]

    # 1. Strip cloudy white AI background fringe (alpha < 100) and smoothly remap solid chrome metal
    a_clean = np.clip((a - 100.0) / (200.0 - 100.0), 0.0, 1.0) * 255.0

    clean_arr = np.stack([r, g, b, a_clean], axis=-1).astype(np.uint8)
    clean_emblem = Image.fromarray(clean_arr, mode="RGBA")

    dir_02 = os.path.join(branding_dir, "02 Rohdateien & Freigestelltes Emblem")
    dir_01 = os.path.join(branding_dir, "01 Offizielle App Icons (Aktuell)")
    os.makedirs(dir_02, exist_ok=True)
    os.makedirs(dir_01, exist_ok=True)
    os.makedirs(project_public_dir, exist_ok=True)

    clean_emblem_path = os.path.join(dir_02, "KeyKalimba_Chrome_Emblem_Transparent_1024x1024.png")
    clean_emblem.save(clean_emblem_path, "PNG")
    print(f"✓ Saved clean transparent emblem: {clean_emblem_path}")

    # Crop to tight bounding box of solid chrome metal
    coords = np.argwhere(clean_arr[:, :, 3] > 10)
    y_min, x_min = coords.min(axis=0)
    y_max, x_max = coords.max(axis=0)
    cropped = clean_emblem.crop((x_min, y_min, x_max, y_max))
    cw, ch = cropped.size

    w, h = 1024, 1024

    # 2. Apple Dark Titanium 135° Gradient Background (#2C2C2E to #1C1C1E) - 100% OPAQUE
    c1 = np.array([44, 44, 46], dtype=np.float32)  # #2C2C2E (SystemGray5)
    c2 = np.array([28, 28, 30], dtype=np.float32)  # #1C1C1E (SystemGray6)
    y_indices, x_indices = np.indices((h, w))
    proj = (x_indices + y_indices) / (2.0 * 1024.0)
    proj = np.clip(proj, 0.0, 1.0)[:, :, np.newaxis]
    grad = (1.0 - proj) * c1 + proj * c2
    bg_opaque_rgba = Image.fromarray(grad.astype(np.uint8), mode='RGB').convert('RGBA')

    # ==========================================
    # A. MASTER SOCIAL AVATAR (YouTube / Ko-fi / Discord)
    # Circle balanced: target_w = 660, offset = -28px left
    # ==========================================
    avatar_w = 660
    avatar_h = int(ch * (avatar_w / cw))
    scaled_avatar = cropped.resize((avatar_w, avatar_h), Image.Resampling.LANCZOS)
    asw, ash = scaled_avatar.size
    avatar_x = (w - asw) // 2 - 28
    avatar_y = (h - ash) // 2

    # Black contact shadow
    shadow_layer_av = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    s_glyph_av = Image.new('RGBA', (asw, ash), (0, 0, 0, 200))
    s_glyph_av.putalpha(scaled_avatar.split()[3])
    shadow_layer_av.paste(s_glyph_av, (avatar_x + 3, avatar_y + 14))
    b_shadow_av = shadow_layer_av.filter(ImageFilter.GaussianBlur(radius=20))

    fg_layer_av = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    fg_layer_av.paste(scaled_avatar, (avatar_x, avatar_y))

    # True alpha composite onto 100% opaque background (guarantees alpha = 255 everywhere)
    comp_av = Image.alpha_composite(bg_opaque_rgba, b_shadow_av)
    master_avatar = Image.alpha_composite(comp_av, fg_layer_av)

    avatar_path = os.path.join(dir_01, "KeyKalimba_ProfileAvatar_YouTube_Kofi_Social_1024x1024.png")
    master_avatar.save(avatar_path, "PNG")
    print(f"✓ Saved 100% Opaque Social Avatar: {avatar_path}")

    # ==========================================
    # B. MASTER SQUIRCLE APP ICON (iOS, macOS, PWA)
    # ==========================================
    app_w = 710
    app_h = int(ch * (app_w / cw))
    scaled_app = cropped.resize((app_w, app_h), Image.Resampling.LANCZOS)
    apw, aph = scaled_app.size
    app_x = (w - apw) // 2 - 14
    app_y = (h - aph) // 2

    shadow_layer_app = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    s_glyph_app = Image.new('RGBA', (apw, aph), (0, 0, 0, 190))
    s_glyph_app.putalpha(scaled_app.split()[3])
    shadow_layer_app.paste(s_glyph_app, (app_x + 4, app_y + 15))
    b_shadow_app = shadow_layer_app.filter(ImageFilter.GaussianBlur(radius=22))

    fg_layer_app = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    fg_layer_app.paste(scaled_app, (app_x, app_y))

    comp_app = Image.alpha_composite(bg_opaque_rgba, b_shadow_app)
    master_app_full = Image.alpha_composite(comp_app, fg_layer_app)

    # Squircle Mask for iOS/App Store
    mask_squircle = Image.new('L', (w, h), 0)
    draw_s = ImageDraw.Draw(mask_squircle)
    draw_s.rounded_rectangle([0, 0, w, h], radius=232, fill=255)

    master_app = master_app_full.copy()
    master_app.putalpha(mask_squircle)

    app_path = os.path.join(dir_01, "KeyKalimba_AppIcon_1024x1024.png")
    master_app.save(app_path, "PNG")
    print(f"✓ Saved Squircle App Icon: {app_path}")

    # ==========================================
    # C. EXPORT APP SIZES (PWA, Apple Touch Icon, Favicon)
    # ==========================================
    sizes = {
        "pwa-512x512.png": (512, 512),
        "pwa-192x192.png": (192, 192),
        "apple-touch-icon.png": (180, 180),
        "favicon.png": (64, 64)
    }

    for filename, size in sizes.items():
        resized = master_app.resize(size, Image.Resampling.LANCZOS)
        out_pub = os.path.join(project_public_dir, filename)
        resized.save(out_pub, "PNG")

        branding_name = filename.replace("pwa-", "KeyKalimba_AppIcon_").replace("apple-touch-icon", "KeyKalimba_AppleTouchIcon_180x180").replace("favicon", "KeyKalimba_Favicon_64x64")
        resized.save(os.path.join(dir_01, branding_name), "PNG")
        print(f"✓ Exported {filename} ({size[0]}x{size[1]})")

    # ==========================================
    # D. EXPORT PURE SVG
    # ==========================================
    scaled_512 = cropped.resize((int(app_w / 2), int(app_h / 2)), Image.Resampling.LANCZOS)
    temp_p = "/tmp/emblem_final_512.png"
    scaled_512.save(temp_p, "PNG")
    with open(temp_p, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")

    svg_pos_x = (512 - (app_w / 2)) / 2 - 7
    svg_pos_y = (512 - (app_h / 2)) / 2
    svg_w = app_w / 2
    svg_h = app_h / 2

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="appleTitanium" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2C2C2E"/>
      <stop offset="100%" stop-color="#1C1C1E"/>
    </linearGradient>
    <filter id="darkContactShadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="2" dy="8" stdDeviation="11" flood-color="#000000" flood-opacity="0.75"/>
    </filter>
    <clipPath id="squircleClip">
      <rect width="512" height="512" rx="116"/>
    </clipPath>
  </defs>
  <rect width="512" height="512" rx="116" fill="url(#appleTitanium)"/>
  <g clip-path="url(#squircleClip)">
    <image href="data:image/png;base64,{b64}" x="{svg_pos_x}" y="{svg_pos_y}" width="{svg_w}" height="{svg_h}" filter="url(#darkContactShadow)"/>
  </g>
</svg>'''.strip()

    with open(os.path.join(project_public_dir, "favicon.svg"), "w") as f:
        f.write(svg_content)
    with open(os.path.join(dir_01, "KeyKalimba_Favicon.svg"), "w") as f:
        f.write(svg_content)
    print("✓ Exported pure SVG: favicon.svg")

    print("\n✨ All Key Kalimba Master Icons & Avatars updated successfully!")

if __name__ == "__main__":
    generate_all_icons()
