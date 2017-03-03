---
title: Оптимизация текстур + автоматизация сборки
date: 2017-03-01 18:32:49
category: Cocos2d
tags: cocos2d
---

Всем привет. Давайте немного поговорим об оптимизации, я часто слышу от разных людей что преждевременная оптимизация это зло, но тем не менее лучше сразу использовать базовые правила оптимизации, чтобы потом не переписывать много кода. О чем будет статья? Начнем с основ, как и зачем объеденять изображения в атласы, как объеденить атласы с bitmap-шрифтом, как сжать png-файлы без сильной патери качества, ну и на последок как все эти процессы автоматизировать с помощью python скрипта, который можно запускать на любой ОС. Примеры будут написаны на Cocos2d, но в целом эти правила применимы для любого webgl-движка. 

<!-- more -->

Давайте рассмотрим простой пример:
```JavaScript
var CardView = cc.Sprite.extend({
    ctor: function(filename) {
        this._super(filename);
    }
});

var AppLayer = cc.Layer.extend({
    sprite:null,
    ctor:function () {
        this._super();
        //
        var table = new cc.Sprite(res.table_png);
        table.x =  cc.winSize.width / 2;
        table.y = cc.winSize.height / 2;
        this.addChild(table, 0);
        //
        var card1 = this.createCard(res.card1_png);
        card1.x = 250;
        //
        var card2 = this.createCard(res.card2_png);
        card2.x = 550;
        //
        return true;
    },

    createCard: function(filename) {
        var card = new CardView(filename);
        card.y = cc.winSize.height/2;
        this.addChild(card);
        return card;
    }
});
```
{% asset_img screen1.png %}

В каталоге **res** лежат три файла:
--./res/
-----table.png
-----card1.png
-----card2.png

Смотрим на количество drawcall-ов: 3 это конечно не много, но с ростом проекта, будет сильно расти и drawcall, что в конечном итоге может привести к плачевным результатам. Давайте соберем текстурный атлас, делается это с помощью  приложения [Texture Packer](https://www.codeandweb.com/texturepacker). Интерфейс у приложения примитивный, поэкспериментируйте и пойдем дальше. 

Атласы конечно удобно создавать с помощью Texture packer, но мы же программисты, поэтому будем использовать командную строку, чтобы автоматизировать этот процесс. Для этого необходимо из приложения **Texture Packer** установить утилиты командной строки, делается это в меню Texture Packer -> Install Command Line Tool:
{% asset_img TexturePacker-InstallCommandLineTool.png %}
Документацию по комндной строке TM вы найдете [здесь](https://www.codeandweb.com/texturepacker/documentation#command-line), мы же напишем python скрипт, который будем расширять для других целей оптимизации. Для начала необходимо всю графику, которую мы планируем затолкать в атлас удалить из каталога **res/** и перенести куда нибудь в другое место, например в каталог **content/images/**. Далее создаем файл **CreateAtlas.py** в каталоге **content/** с содержимым:

```Python
#! /usr/bin/env python
# -*- coding: utf-8 -*- 

import subprocess
import shutil
from shutil import copyfile
import os

# Корневой каталог проекта,
# и запускать скрипт необходимо из этого каталога
RootDir=os.getcwd();

# контент каталог 
WorkDir=RootDir+"/content/"
# каталог где лежат все изображения для атласа
ImagesDir=WorkDir+"/images/"
# временный каталог в котором будем генерить атласы
TempDir=WorkDir+"/.temp/"
# каталог в котором лежат ресурсы для приложения
ResDir=RootDir+"/res/"

# Очищаем временный каталог
if os.path.isdir(TempDir):
    shutil.rmtree(TempDir)
os.makedirs(TempDir)


# Создаем атлас из всех картинок, лежащих в каталоге ImagesDir
bashCommand="TexturePacker --force-publish --data "+TempDir+"/atlas.plist --format cocos2d "+ImagesDir
process = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE)
output, error = process.communicate()

# копируем атлас в каталог ResDir
shutil.copy(TempDir+'/atlas.png', ResDir);
shutil.copy(TempDir+'/atlas.plist', ResDir);
```
Этот скрипт создает временную директорию **temp/** в каталоге **content/** в котором создает атлас, используя ВСЕ изображения из каталога **content/images/**. После создания атласа, файлы _atlas.png_, _atlas.plist_ копируются в каталог **res/** для использования в приложении. Чтобы запустить скрипт, наберите в терминале команду
```bash
python content/CreateAtlas.py
```

Пример загрузки изображения из атласа в Cocos2d-JS:
```JavaScript
var CardView = cc.Sprite.extend({
    ctor: function(filename) {
        this._super(filename);
    }
});

var AppLayer = cc.Layer.extend({
    sprite:null,
    ctor:function () {
        this._super();
        //
        cc.spriteFrameCache.addSpriteFrames(res.atlas_plist);
        //
        var table = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame('table.png'));
        table.x =  cc.winSize.width / 2;
        table.y = cc.winSize.height / 2;
        this.addChild(table, 0);
        //
        var card1 = this.createCard(cc.spriteFrameCache.getSpriteFrame('card1.png'));
        card1.x = 250;
        //
        var card2 = this.createCard(cc.spriteFrameCache.getSpriteFrame('card2.png'));
        card2.x = 550;
        //
        return true;
    },

    createCard: function(filename, text) {
        var card = new CardView(filename, text);
        card.y = cc.winSize.height/2;
        this.addChild(card);
        return card;
    }
});
```
И результат:
{% asset_img screen2.png %}
Как видно количество drawcall-ов уменьшилось до 1. Давайте теперь добавим текста на каждую карту. Текст будем рисовать bitmap-шрифтом, который создается с помощью утилиты [bmGlyph](https://www.bmglyph.com/), кажется что drawcall-ы увеличатся на 1:
```JavaScript
var CardView = cc.Sprite.extend({
    ctor: function(filename, text) {
        this._super(filename);
        //
        var label = new cc.LabelBMFont(text, res.ArialBold_fnt, 220, cc.TEXT_ALIGNMENT_CENTER);
        label.x = 15+this.getContentSize().width/2;
        label.y = 65;
        this.addChild(label);
    }
});

var AppLayer = cc.Layer.extend({
    sprite:null,
    ctor:function () {
        this._super();
        //
        cc.spriteFrameCache.addSpriteFrames(res.atlas_plist);
        //
        var table = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame('table.png'));
        table.x =  cc.winSize.width / 2;
        table.y = cc.winSize.height / 2;
        this.addChild(table, 0);
        //
        var card1 = this.createCard(cc.spriteFrameCache.getSpriteFrame('card1.png'),
            'Магическаая сила\n+20');
        card1.x = 250;
        //
        var card2 = this.createCard(cc.spriteFrameCache.getSpriteFrame('card2.png'),
            'Меткость\n+30');
        card2.x = 550;
        //
        return true;
    },

    createCard: function(filename, text) {
        var card = new CardView(filename, text);
        card.y = cc.winSize.height/2;
        this.addChild(card);
        return card;
    }
});
```
{% asset_img screen3.png %}

, но нет, их уже 4. Почему? потому что текст рисуется в том же слое что и карта, в итоге отрисовка всей сцены происходит в 4 шага, каждый шаг - это загрузка новой текстуры на видеокарту:
1. Отрисовка фона + изображение 1 карты
2. Текст карты 1
3. Изображение карты 2
4. Текст карты 2

А теперь предствьте что у вас UI-интерфейс в котором много картинок и текста, количество обращений к видеокарте будет расти очень быстро. Что мы можем с этим сделать? Можно попробовать разделить отрисовку изображений от шрифтов, так чтобы на одном слое были все изображения, а на другом все шрифты, и тогда сцена будет отрисовываться в два прохода. Но поддерживать такой код будет сложнее, да и к тому же текст должен лежать на карте, и анимироваться вместе, поэтому разделение на слои в данном случае не подходит. Остается объеденить шрифт и изображения в один атлас, для этого необходимо собрать атлас вместе с изображением шрифта, и обновить координаты символов в .fnt-файле. Для этого допишем наш **python** скрипт:

<a name="script"></a>
```Python
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


# Создаем атлас из всех картинок, лежащих в каталоге ImagesDir
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

# копируем получившиеся файлы в каталог res/
shutil.copy(TempDir+'/atlas.png', ResDir)
shutil.copy(TempDir+'/atlas.plist', ResDir)
shutil.copy(TempDir+'/'+ArialBoldFont+'.fnt', ResDir)
```

JS код остается без изменений, и смотрим на результат:
{% asset_img final.png %}

Супер, теперь вся сцена рисуется в один проход. Идем дальше.

# Оптимизируем размер файла
Итоговый атлас с 3 картинками и одним шрифтом у меня получился объемом **1.3Мб**, а что если карт будет много... Давайте попробуем сжать. Сделать это можно разными способами, например указать в настройках TexturePacker формат оптимизации с помощью опции `--opt`:
```bash
TexturePacker --opt RGBA4444 --force-publish --data atlas.plist --format cocos2d ./images/
```
Подробную информацию о вариантах опции `--opt` вы найдете в [документации](https://www.codeandweb.com/texturepacker/documentation). 
Например если использовать формат `RGBA4444` файл уменьшается до размера **330кб**, и вот как будет выглядеть в кокосе:
{% asset_img final_optimize_tm.png %}

Еще есть такой замечательный ресурс, как https://tinypng.com, с помощью которого вы можете оптимизировать свои изображения, и конечно же мы будем использовать его из командной строки, используя [API](https://tinypng.com/developers)(необходимо зарегистрироваться и получить API KEY):
```Python
API_KEY='...'
def compressWithTiny(filename):
    # запускаем скрипт оптимизации
    bashCommand='curl --user api:'+API_KEY+' --data-binary @'+filename+' -i https://api.tinify.com/shrink'
    process = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE)
    output, error = process.communicate()
    # вытаскиваем ссылку на картинку
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
```
Итоговый размер атласа **262кб**, сравните результат:
{% asset_img final_optimize_tiny.png %}

Мне кажется здесь tiny справился лучше, и размер меньше и качество выше, думаю для разных картинок и задач можно выбирать разные инструменты, в общем пробуйте и рассказывайте что получилось у вас :).

Ссылки:
 - <a target="_blank" href="{% asset_path CreateAtlas.py %}">Скрипт CreateAtlas.py</a>