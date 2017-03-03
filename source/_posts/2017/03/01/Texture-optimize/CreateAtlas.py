#! /usr/bin/env python
# -*- coding: utf-8 -*- 

import subprocess
import shutil
import os
import xml.etree.ElementTree
import re

# Корневой каталог проекта,
# и запускать скрипт необходимо из этого каталога
RootDir=os.getcwd();

# контент каталог 
WorkDir=RootDir+"/content"
# каталог где лежат все изображения для атласа
ImagesDir=WorkDir+"/images/"
# временный каталог в котором будем генерить атласы
TempDir=WorkDir+"/.temp/"
# каталог в котором лежат ресурсы для приложения
ResDir=RootDir+"/res/"

# каталог со шрифтами
FontDirectory=WorkDir+'/fonts'
# Обновляемый шрифт
ArialBoldFont='ArialBold'



# Копируем изображение шрифта в каталог images/
shutil.copy(FontDirectory+'/'+ArialBoldFont+'.png', ImagesDir);

# Очищаем временный каталог
if os.path.isdir(TempDir):
    shutil.rmtree(TempDir)
os.makedirs(TempDir)


# # Создаем атлас из всех картинок, лежащих в каталоге ImagesDir
bashCommand="TexturePacker --force-publish --data "+TempDir+"/atlas.plist --format cocos2d "+ImagesDir
process = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE)
output, error = process.communicate()



AtlasFile = open(TempDir+'/atlas.plist', 'r')
AtlasContent = AtlasFile.read()
AtlasFile.close()

def updateFont(fontName):
    matches = re.search('<key>'+fontName+'\.png<\/key>[\w\W]+?<key>textureRect</key>\s+<string>\{\{(\d+),(\d+)', AtlasContent, re.MULTILINE)
    shift = {};
    shift['x'] = int(matches.group(1));
    shift['y'] = int(matches.group(2));
    print(shift)
    #
    # загружаем текст .fnt файла
    with open(FontDirectory+'/'+fontName+'.fnt') as f:
        FntContent = f.readlines()
    f.close()
    #
    xyPattern = re.compile('(x|y)=(\d+)')
    filePattern = re.compile('file="([^"]+)"')
    tagetFile = open(TempDir+'/'+fontName+'.fnt', 'w')
    # начинаем считывать его по-строчно
    for fntLine in FntContent:
        result = xyPattern.findall(fntLine);
        for v in result:
            key = v[0]
            value = int(v[1])-1;
            # применяем смещение в x,y
            fntLine = fntLine.replace(key+'='+v[1], key+'='+str(value+shift[key]));
        result = filePattern.findall(fntLine);
        if len(result) > 0:
            # меням путь к файлу на атлас
            fntLine = fntLine.replace('file="'+result[0]+'"', 'file="atlas.png"');
        # записываем строку в новый файл
        tagetFile.write(fntLine)

# запускаем метод обновления шрифта
updateFont(ArialBoldFont)


API_KEY='...'
def compressWithTiny(filename):
    # запускаем скрипт оптимизации
    bashCommand='curl --user api:'+API_KEY+' --data-binary @'+filename+' -i https://api.tinify.com/shrink'
    process = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE)
    output, error = process.communicate()
    # вытаскиев ссылку на картинку
    locationPattern = re.search('Location:\s*([^\n\s]+)', output, re.MULTILINE)
    pngUrl = locationPattern.group(1)
    print('Optimize url:', pngUrl)
    #
    # скачиваем оптимизированную картинку
    temp = filename.split('.png');
    outFilename = temp[0]+'_optimize.png';
    bashCommand='curl '+pngUrl+' -o '+outFilename
    process = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE)
    process.communicate()

compressWithTiny(TempDir+'/atlas.png');

# копируем получившиеся файлы в каталог res/
shutil.copy(TempDir+'/atlas_optimize.png', ResDir+'/atlas.png')
shutil.copy(TempDir+'/atlas.plist', ResDir)
shutil.copy(TempDir+'/'+ArialBoldFont+'.fnt', ResDir)
