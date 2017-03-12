import json
import re
import sys
import shutil
import os
import glob
import subprocess
import tinify
from PIL import Image


def getArgs(name, isArray=False):
    args_str = ' '.join(sys.argv)
    matches = re.search(name+'\s+([^-$]+[^\s-])', args_str)
    if not matches:
        return None
    group = matches.group(1)
    if not isArray:
        return group
    return group.split(' ')


ConfigUrl = getArgs("-c", False)
if ConfigUrl == None: ConfigUrl = 'config.json'
if not os.path.exists(ConfigUrl):
    print('Файл '+ConfigUrl+' не найден')
    sys.exit(-1)

ConfigFile = open(ConfigUrl, 'r')
ConfigStr = ConfigFile.read()
ConfigFile.close()

IsWin = sys.platform in ['win32', 'cygwin']
if IsWin: ConfigStr = ConfigStr.replace('/', '\\\\')
Config = json.loads(ConfigStr)

TempDir = '.temp/'
ImagesDir = TempDir+'images/'

def copyTo(fromFile, toFileOrDir):
    toFile = None;
    if re.search('\.[\w]+$', toFileOrDir) != None:
        toFile = toFileOrDir
        baseDir = os.path.dirname(toFileOrDir)
    else:
        baseDir = toFileOrDir
        filename = os.path.basename(fromFile)
        toFile = baseDir + '/' + filename
    #
    if not os.path.exists(baseDir):
        os.makedirs(baseDir)
    shutil.copy(fromFile, toFile)


def createTempDir():
    if os.path.exists(TempDir):
        shutil.rmtree(TempDir)
    os.makedirs(TempDir)

def copyImages(atlasConf):
    WorkDir = atlasConf['work']
    ImagesConf = {} if 'images' not in atlasConf else atlasConf['images']
    Exclude = [] if 'exclude' not in ImagesConf else ImagesConf['exclude']
    if not isinstance(Exclude, list): Exclude = [Exclude]
    #
    images = []
    templates = ['**/*.png', '**/*.jpg'] if 'templates' not in ImagesConf else ImagesConf['templates']
    if not isinstance(templates, list): templates = [templates]
    images = []
    for template in templates: images += glob.glob(WorkDir + template, recursive=True)
    #
    for image in images:
        imageExclude = False
        for ex in Exclude:
            if ex in image:
                imageExclude = True

        if not imageExclude:
            copyTo(image, ImagesDir + atlasConf['keyPath'] + '/' + image.split(WorkDir)[1])


# fonts begin ********************************************************************************
# pip3 install Pillow
def extractFontChars(font):
    fntImage = Image.open(font['path'] + '.png')
    #
    charsDir = ImagesDir+'_chars_/'+font['name']+'/'
    if not os.path.exists(charsDir):
        os.makedirs(charsDir)
    #
    FntFile = open(font['path'] + '.fnt', 'r')
    FntContent = FntFile.readlines()
    FntFile.close()
    for fntLine in FntContent:
        if not re.search('^char\s+', fntLine): continue
        #
        id = re.search('id=(\d+)', fntLine).group(1)
        x = int(re.search('x=(\d+)', fntLine).group(1))
        y = int(re.search('y=(\d+)', fntLine).group(1))
        w = int(re.search('width=(\d+)', fntLine).group(1))
        h = int(re.search('height=(\d+)', fntLine).group(1))
        if w == 0 or h == 0: continue
        box = (x, y, x+w, y+h)
        crop = fntImage.crop(box)
        crop.save(charsDir+id+'.png')

def getShift(name, AtlasContent):
    template = '<key>' + name + '\.png<\/key>[\w\W]+?<key>textureRect</key>\s+<string>\{\{(\d+),(\d+)'
    matches = re.search(template, AtlasContent, re.MULTILINE)
    if not matches: return None
    shift = {}
    shift['x'] = int(matches.group(1))
    shift['y'] = int(matches.group(2))
    return shift

def shiftFont(atlasConf, AtlasContent, font, fullOutPath):
    isDense = 'dense' in font and font['dense'] == True
    shift = None
    if not isDense:
        shift = getShift(atlasConf['name'] + '/' + font['name'], AtlasContent)
        print('shift', shift);
    #
    with open(font['path'] + '.fnt') as f:
        FntContent = f.readlines()
    f.close()
    xyPattern = re.compile('(x|y)=(\d+)')
    filePattern = re.compile('file="([^"]+)"')
    tagetFile = open(TempDir + font['name'] + '.fnt', 'w')
    #
    for fntLine in FntContent:
        result = xyPattern.findall(fntLine)
        idSearch = re.search('id=(\d+)', fntLine)
        id = '' if not idSearch else idSearch.group(1)
        if isDense:
            shift = getShift('_chars_/'+font['name']+'/'+id, AtlasContent)
        for v in result:
            key = v[0]
            value = int(v[1])
            # применяем смещение в x,y
            if not isDense:
                value = value + shift[key]
            else:
                value = 0 if not shift else shift[key]
            fntLine = fntLine.replace(key + '=' + v[1], key + '=' + str(value))
        result = filePattern.findall(fntLine)
        if len(result) > 0:
            # меням путь к файлу на атлас
            fntLine = fntLine.replace('file="' + result[0] + '"', 'file="' + atlasConf['name'] + '.png"')
        # записываем строку в новый файл
        tagetFile.write(fntLine)
    tagetFile.close()
    #
    fontOutName = font['name'] if 'out' not in font else font['out']
    copyTo(TempDir + font['name'] + '.fnt', fullOutPath + fontOutName + '.fnt')


# fonts end ********************************************************************************

def runTP(atlasName, tpOptions):
    bashcmd = 'TexturePacker '
    for key in tpOptions:
        bashcmd += ' '+key+' '
        if tpOptions[key] != None: bashcmd += tpOptions[key]+' '
    bashcmd += ' --force-publish --data ' + atlasName + '.plist --format cocos2d images'
    process = subprocess.Popen(bashcmd.split(), cwd=TempDir, stdout=subprocess.PIPE)
    output, error = process.communicate()

def compressWithTiny(filename):
    temp = filename.split('.png')
    originalFilename = temp[0] + '_original.png'
    copyTo(TempDir + filename, TempDir + originalFilename)
    #
    # запускаем скрипт оптимизации
    tinify.key = Config['settings']['tinyKey']
    source = tinify.from_file(TempDir+originalFilename)
    source.to_file(TempDir+filename)

def createAtlas(atlasConf):
    print("------ create atlas ------\n", atlasConf, '\n')
    if 'tpOptions' in atlasConf: tpOptions = atlasConf['tpOptions']
    else: tpOptions = {}

    #
    createTempDir()
    #
    #
    copyImages(atlasConf)
    #
    if 'fonts' in atlasConf:
        for font in atlasConf['fonts']:
            tpOptions['--disable-rotation'] = None
            if 'dense' not in font or not font['dense']:
                copyTo(font['path'] + '.png', ImagesDir+atlasConf['name'])
            else:
                extractFontChars(font)
    #
    #
    runTP(atlasConf['name'], tpOptions)
    AtlasFile = open(TempDir + '/' + atlasConf['name']+'.plist', 'r')
    AtlasContent = AtlasFile.read()
    AtlasFile.close()
    #
    if 'tinify' in atlasConf and atlasConf['tinify']:
        compressWithTiny(atlasConf['name']+'.png')
    #
    fullOutPath = Config['settings']['outPath']
    if 'out' in atlasConf: fullOutPath += atlasConf['out']
    #
    if 'fonts' in atlasConf:
        for font in atlasConf['fonts']:
            shiftFont(atlasConf, AtlasContent, font, fullOutPath)
    #
    copyTo(TempDir+atlasConf['name']+'.png', fullOutPath)
    copyTo(TempDir+atlasConf['name']+'.plist', fullOutPath)


def runApp():
    atlasesNames = getArgs("-p", True)
    for atlasName in Config['atlases']:
        if not atlasesNames or atlasName in atlasesNames:
            atlasConf = Config['atlases'][atlasName]
            if 'name' not in atlasConf: atlasConf['name'] = atlasName
            if 'keyPath' not in atlasConf: atlasConf['keyPath'] = atlasConf['name']
            createAtlas(atlasConf)

runApp()
