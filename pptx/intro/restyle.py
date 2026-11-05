"""Restyle the coauthor's intro deck (AIAgents.pptx) to the look of qcor-bruno-agents.pptx.

Content, positions, animations and notes stay as they are. What changes:
  theme   : fonts -> Arial; colour scheme -> the talk's (black stage, F5F5F7 text, Apple greys, 0A84FF blue)
  master  : title tracking back to normal (the template had -1 pt)
  pills   : grey-green -> the talk's dim grey; slide 6 cards -> card grey, no outline, small corner radius
  slide 5 : 0070C0 circles -> the talk's blue
  slide 7 : grey wash -> black dim (how the talk dims what isn't picked); red frame -> blue, 2 pt, small radius
  titles  : all 40 pt bold, as in the talk
  sources : 11 pt muted grey, centred at the bottom, as in the talk
usage (from pptx/intro/): python3 restyle.py AIAgents.pptx AIAgents-restyled.pptx
Each edit checks how many places it hit, so a changed original stops the script instead of half-restyling it.
"""
import re
import sys
import zipfile

src, dst = sys.argv[1], sys.argv[2]

HEX = dict(bg="000000", text="F5F5F7", muted="8E8E93", card="1C1C1E", raised="2C2C2E", dim="3A3A3C",
           edge="48484A", blue="0A84FF", green="30D158", orange="FF9F0A")
EMU = 914400


def sub(s, old, new, n=None, regex=False, part=""):
    """Replace and check the number of hits, so a template change can't silently skip an edit."""
    out, k = (re.subn(old, new, s) if regex else (s.replace(old, new), s.count(old)))
    if (n is not None and k != n) or k == 0:
        raise SystemExit(f"{part}: expected {n} hit(s) of {old[:60]!r}, got {k}")
    return out


def radius_adj(r_in, w_emu, h_emu):
    """roundRect adj for a corner radius of r_in inches."""
    return round(r_in * EMU / min(w_emu, h_emu) * 100000)


def edit_shape(s, name, fn, part):
    """Apply fn to the <p:sp> whose cNvPr has this name."""
    hits = [m for m in re.finditer(r"<p:sp>.*?</p:sp>", s, flags=re.S) if f'name="{name}"' in m.group(0)]
    if len(hits) != 1:
        raise SystemExit(f"{part}: {len(hits)} shapes named {name!r}")
    m = hits[0]
    return s[: m.start()] + fn(m.group(0)) + s[m.end():]


# The template's colour map is bg1=dk1, tx1=lt1, bg2=dk2, tx2=lt2 (a dark theme), so the slots are filled that way.
# tx2 (lt2) is the title layout's text ("Rosa, 71"); it was near-white, so it stays the talk's text white.
SCHEME = (
    '<a:clrScheme name="QCOR 2026">'
    f'<a:dk1><a:srgbClr val="{HEX["bg"]}"/></a:dk1><a:lt1><a:srgbClr val="{HEX["text"]}"/></a:lt1>'
    f'<a:dk2><a:srgbClr val="{HEX["card"]}"/></a:dk2><a:lt2><a:srgbClr val="{HEX["text"]}"/></a:lt2>'
    f'<a:accent1><a:srgbClr val="{HEX["blue"]}"/></a:accent1><a:accent2><a:srgbClr val="{HEX["green"]}"/></a:accent2>'
    f'<a:accent3><a:srgbClr val="{HEX["orange"]}"/></a:accent3><a:accent4><a:srgbClr val="{HEX["raised"]}"/></a:accent4>'
    f'<a:accent5><a:srgbClr val="{HEX["dim"]}"/></a:accent5><a:accent6><a:srgbClr val="{HEX["edge"]}"/></a:accent6>'
    f'<a:hlink><a:srgbClr val="{HEX["blue"]}"/></a:hlink><a:folHlink><a:srgbClr val="{HEX["muted"]}"/></a:folHlink>'
    "</a:clrScheme>"
)

PILL = '<a:schemeClr val="bg2"><a:lumMod val="75000"/><a:lumOff val="25000"/></a:schemeClr>'
CARD = '<a:schemeClr val="bg2"><a:lumMod val="90000"/><a:lumOff val="10000"/></a:schemeClr>'


def citation(sp):
    """The talk's source line: 11 pt muted grey, centred in the bottom band, no wrap-none autogrow."""
    x, y, w, h = 1.6, 6.88, 10.13, 0.46
    sp = sub(sp, r'<a:off x="-?\d+" y="-?\d+"/><a:ext cx="\d+" cy="\d+"/>',
             f'<a:off x="{round(x * EMU)}" y="{round(y * EMU)}"/><a:ext cx="{round(w * EMU)}" cy="{round(h * EMU)}"/>',
             1, regex=True, part="citation")
    sp = sub(sp, '<a:bodyPr wrap="none" rtlCol="0"><a:spAutoFit/></a:bodyPr>',
             '<a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="b"><a:noAutofit/></a:bodyPr>',
             1, part="citation")
    # drop the empty trailing paragraph (a single space), which would lift the line off the bottom
    sp = sub(sp, '<a:p><a:r><a:rPr lang="en-US" dirty="0"/><a:t> </a:t></a:r></a:p>', "", 1, part="citation")
    sp = sub(sp, "<a:lstStyle/><a:p><a:r>", '<a:lstStyle/><a:p><a:pPr algn="ctr"/><a:r>', 1, part="citation")
    run = f'sz="1100" dirty="0"\\1><a:solidFill><a:srgbClr val="{HEX["muted"]}"/></a:solidFill></a:rPr>'
    return sub(sp, r'dirty="0"( err="1")?/>', run, 3, regex=True, part="citation")


def theme(s, part):
    s = sub(s, r"<a:clrScheme\b.*?</a:clrScheme>", SCHEME, 1, regex=True, part=part)
    return sub(s, '<a:latin typeface="Neue Haas Grotesk Text Pro"/>', '<a:latin typeface="Arial"/>', 2, part=part)


def master(s, part):
    return sub(s, 'sz="3000" b="0" kern="1200" spc="-100"', 'sz="3000" b="0" kern="1200"', 1, part=part)


def layout19(s, part):
    return sub(s, 'typeface="Neue Haas Grotesk Text Pro"', 'typeface="Arial"', part=part)


def ring_slide(s, part):  # slides 2, 3, 7: the circle of interventions
    s = sub(s, PILL, f'<a:srgbClr val="{HEX["dim"]}"/>', 12, part=part)
    return edit_shape(s, "TextBox 35", citation, part)


def slide5(s, part):
    return sub(s, 'srgbClr val="0070C0"', f'srgbClr val="{HEX["blue"]}"', 3, part=part)


def fix_title5(s, part):
    s = sub(s, '<a:rPr lang="en-US" sz="4000" dirty="0"/><a:t>Moving Beyon',
             '<a:rPr lang="en-US" sz="4000" b="1" dirty="0"/><a:t>Moving Beyon', 1, part=part)
    return sub(s, '<a:rPr lang="en-US" dirty="0"/><a:t>d Chatbots',
               '<a:rPr lang="en-US" sz="4000" b="1" dirty="0"/><a:t>d Chatbots', 1, part=part)


def slide6(s, part):
    def card(sp):
        w, h = map(int, re.search(r'<a:ext cx="(\d+)" cy="(\d+)"/>', sp).groups())
        sp = sub(sp, '<a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>',
                 f'<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val {radius_adj(0.15, w, h)}"/></a:avLst></a:prstGeom>',
                 1, part=part)
        return sub(sp, f"<a:solidFill>{CARD}</a:solidFill>",
                   f'<a:solidFill><a:srgbClr val="{HEX["card"]}"/></a:solidFill><a:ln><a:noFill/></a:ln>', 1, part=part)
    for name in ("Rounded Rectangle 9", "Rounded Rectangle 10", "Rounded Rectangle 11"):
        s = edit_shape(s, name, card, part)
    return sub(s, '<a:rPr lang="en-US" sz="4400" b="1" dirty="0"><a:latin typeface="+mn-lt"/></a:rPr><a:t>Range of',
               '<a:rPr lang="en-US" sz="4000" b="1" dirty="0"><a:latin typeface="+mn-lt"/></a:rPr><a:t>Range of', 1, part=part)


def slide7(s, part):
    s = ring_slide(s, part)
    s = edit_shape(s, "Rectangle 9", lambda sp: sub(
        sp, '<a:solidFill><a:schemeClr val="tx1"><a:lumMod val="50000"/><a:alpha val="76000"/></a:schemeClr></a:solidFill>',
        f'<a:solidFill><a:srgbClr val="{HEX["bg"]}"><a:alpha val="76000"/></a:srgbClr></a:solidFill><a:ln><a:noFill/></a:ln>',
        1, part=part), part)

    def frame(sp):
        w, h = map(int, re.search(r'<a:ext cx="(\d+)" cy="(\d+)"/>', sp).groups())
        sp = sub(sp, '<a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>',
                 f'<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val {radius_adj(0.15, w, h)}"/></a:avLst></a:prstGeom>',
                 1, part=part)
        return sub(sp, '<a:ln w="57150"><a:solidFill><a:srgbClr val="C00000"/></a:solidFill></a:ln>',
                   f'<a:ln w="25400"><a:solidFill><a:srgbClr val="{HEX["blue"]}"/></a:solidFill></a:ln>', 1, part=part)
    s = edit_shape(s, "Rounded Rectangle 8", frame, part)
    return sub(s, '<a:rPr lang="en-US" dirty="0"/><a:t>Today’s task',
               '<a:rPr lang="en-US" sz="4000" b="1" dirty="0"/><a:t>Today’s task', 1, part=part)


EDITS = {
    "ppt/theme/theme1.xml": [theme],
    "ppt/slideMasters/slideMaster1.xml": [master],
    "ppt/slideLayouts/slideLayout19.xml": [layout19],
    "ppt/slides/slide2.xml": [ring_slide],
    "ppt/slides/slide3.xml": [ring_slide],
    "ppt/slides/slide5.xml": [slide5, fix_title5],
    "ppt/slides/slide6.xml": [slide6],
    "ppt/slides/slide7.xml": [slide7],
}

done = set()
with zipfile.ZipFile(src) as zin, zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as zout:
    for info in zin.infolist():
        data = zin.read(info.filename)
        if info.filename in EDITS:
            s = data.decode("utf-8")
            for fn in EDITS[info.filename]:
                s = fn(s, info.filename)
            data = s.encode("utf-8")
            done.add(info.filename)
        zout.writestr(info.filename, data, compress_type=zipfile.ZIP_DEFLATED)

missing = set(EDITS) - done
if missing:
    raise SystemExit(f"parts not found: {sorted(missing)}")
print("wrote", dst)
