'''generate level from SVG'''
import sys
import re

transform = re.compile(r'''transform="matrix\((?P<xs>[^,]+),(?P<xk>[^,]+),(?P<yk>[^,]+),(?P<ys>[^,]+),(?P<xt>[^,]+),(?P<yt>[^\)]+)\)"''')
translate = re.compile(r'''transform="translate\((?P<xt>[^,]+),(?P<yt>[^\)]+)\)"''')
#arc_re = re.compile(r'''<path sodipodi:type="arc" style="fill:#(?P<color>[0-9a-f]+)[^"]*" id="(?P<id>[^"]+)" sodipodi:cx="(?P<x>[^"]+)" sodipodi:cy="(?P<y>[^"]+)" (?P<leftover>[^>]+)>''')

ellipse_re = re.compile(r'''<ellipse (?P<attributes>[^>]+)>''')

id_re = re.compile(r'''\bid="(?P<id>[^"]+)"''')
cy_re = re.compile(r'''\bcy="(?P<y>[^"]+)"''')
cx_re = re.compile(r'''\bcx="(?P<x>[^"]+)"''')
fill_re = re.compile(r'''\bfill="#(?P<color>[0-9a-f]+)"''')

#rect_re = re.compile(r'''<rect style="fill:#(?P<color>[0-9a-f]+)[^"]*" id="(?P<id>[^"]+)" width="(?P<w>[^"]+)" height="(?P<h>[^"]+)" x="(?P<x>[^"]+)" y="(?P<y>[^"]+)"(?P<leftover>[^>]+)>''')
rect_re = re.compile(r'''<rect (?P<attributes>[^>]+)>''')
height_re = re.compile(r'''\bheight="(?P<h>[^"]+)"''')
width_re = re.compile(r'''\bwidth="(?P<w>[^"]+)"''')
y_re = re.compile(r'''\by="(?P<y>[^"]+)"''')
x_re = re.compile(r'''\bx="(?P<x>[^"]+)"''')


line_re = re.compile(r'''<line (?P<attributes>[^>]+)>''')
x1_re = re.compile(r'''\bx1="(?P<x1>[^"]+)"''')
x2_re = re.compile(r'''\bx2="(?P<x2>[^"]+)"''')
y1_re = re.compile(r'''\by1="(?P<y1>[^"]+)"''')
y2_re = re.compile(r'''\by2="(?P<y2>[^"]+)"''')



#coins_re = re.compile('<path sodipodi:type="arc" style="fill:#ffff00" id="(?P<id>[^"]+)" sodipodi:cx="(?P<x>[^"]+)" sodipodi:cy="(?P<y>[^"]+)"[^>]+>')
#'<ellipse style="fill: #ffff00" cx="([^"]+)" cy="([^"]+)"[^>]+/>')
#heart_re = re.compile('<path style="[^"]*stroke-dasharray: 4;[^"]*" d="[^"]*"/>')


if len(sys.argv) < 2:
    print "missing argument svg filename"
    sys.exit()

def flipY(y):
    return 600-float(y) #-1*float(y)
def fixY(y,h):
    return flipY(y)-float(h)



fname = sys.argv[1]

lineNum = 0

pointNames = ["A", "HeadStart", "HeadEnd", "Elbow1", "Hand1",
              "Elbow2", "Hand2", "B", "Knee1", "Foot1Start", "Foot1End",
              "Knee2", "Foot2Start", "Foot2End",]

def getInt(regex, text):
    return int(round(float(regex.findall(text)[0])))

frames = []
frame = []
for text in open(fname):
    if "<title>end" in text:
        break
    if "<title>Layer" in text:
        if frame:
            frames.append(frame)
            frame = []
        lineNum = 0

    scanner = line_re.scanner(text)
    line = scanner.search()
    while line:
        attributes= line.groups()[0]
        #id= id_re.findall(attributes)[0]
        y1= getInt(y1_re, attributes)
        x1= getInt(x1_re, attributes)
        y2= getInt(y2_re, attributes)
        x2= getInt(x2_re, attributes)
        #color= fill_re.findall(attributes)[0]

        if lineNum == 0:
            # from A to HeadStart
            frame.append([x1,y1]) # A
            lineNum += 1

        frame.append([x2,y2])
        lineNum += 1

        line = scanner.search()

maxY = -1000
for frame in frames:
    A = frame[0]
    B = frame[7]
    centerX = (A[0]+B[0])/2
    for coordinate in frame:
        coordinate[0] -= centerX
        maxY = max(maxY, coordinate[1])
print "[ // {} frames generated from {}".format(len(frames), fname )
for frameIdx, frame in enumerate(frames):
    for idx, coordinate in enumerate(frame):
        if idx == 0:
            if frameIdx == 0:
                print "[  // frame {}".format(frameIdx)
            else:
                print "], [  // frame {}".format(frameIdx)
            print "      ",
        else:
            print "    , ",
        coordinate[1] -= maxY
        print "{: >4}, {: <4}  // {}".format(coordinate[0], coordinate[1],  pointNames[idx])
print "]]"
