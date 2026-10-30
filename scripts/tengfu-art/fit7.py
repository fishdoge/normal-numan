import json, os, sys
from PIL import Image
d=sys.argv[1]; outdir=sys.argv[2]
P=json.load(open(f"{d}/prompts7.json"))
import subprocess
dims=json.loads(subprocess.check_output(["node","--experimental-strip-types","--no-warnings","-e",'import("/Users/aaron/program/normal-human/src/game/data/tengfu.ts").then(m=>console.log(JSON.stringify(m.TENGFU.map(d=>[d.id,d.w,d.h]))))']))
CELL=96
os.makedirs(outdir,exist_ok=True)
sheet=[]
for i,(id,w,h) in enumerate(dims):
    src=f"{d}/cut7/{i:02d}.png"
    if not os.path.exists(src): continue
    im=Image.open(src).convert("RGBA")
    a=im.getchannel("A").point(lambda v:255 if v>24 else 0)
    bb=a.getbbox(); im=im.crop(bb)
    W,H=w*CELL,h*CELL; pad=0.04
    s=min(W*(1-2*pad)/im.width, H*(1-2*pad)/im.height)
    im=im.resize((max(1,round(im.width*s)),max(1,round(im.height*s))),Image.LANCZOS)
    can=Image.new("RGBA",(W,H),(0,0,0,0)); can.alpha_composite(im,((W-im.width)//2,(H-im.height)//2))
    can.save(f"{outdir}/{id}.webp","WEBP",quality=86,method=6)
    sheet.append((id,can))
# 預覽總表
x=y=rowh=0; Wt=1600; pos=[]
for id,c in sheet:
    if x+c.width>Wt: x=0; y+=rowh+16; rowh=0
    pos.append((x,y,c)); x+=c.width+16; rowh=max(rowh,c.height)
S=Image.new("RGBA",(Wt,y+rowh),(10,15,22,255))
for x,y,c in pos: S.alpha_composite(c,(x,y))
S.save(f"{d}/fit7_sheet.png"); print(len(sheet))
