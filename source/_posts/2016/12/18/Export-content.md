---
title: Экспорт контента
date: 2016-12-18 00:04:52
tags:
category: convert
---

Я очень долго занимался разработкой на Flash, сделано много проектов на флеше. Теперь возникла необходимость переделать флешь игры на JavaScript. Блог посвящен разработке на JS, поэтому очень хочется приступить к написанию статей посвященных именно ему. Но я все таки решил сперва рассказать как конвертировать существующий flash-контент в JS формат, чтобы нам было с чем работать :). Конвертирование контента может происходить в несколько этапов, и выполняется разными способами, в зависимости от того, что вы конвертируете: картинки, анимации, звуки... В этой статье я расскажу как можно извлечь изображения из .fla файла и скомпилированного .swf.

<!-- more -->

## Экспорт из .fla
Конечно вы можете экспортировать каждый файл руками, но мы же программисты, поэтому будем писать для этого скрипты. К тому же когда контента много - скрипт, это единственное разумное решение. [Здесь](http://flashpress.ru/blog/jsfl-export-images/) есть отличная статья на тему как написать скрипт JSFL для экспорта всех изображений из Adobe Animate. Там вы найдете подробную инструкцию как написать скрипт, и готовый JSFL файл, который умеет экспортировать файлы по правилам заданным в конфиг-файле. Если же у вас есть MovieClip с анимацией, которую необходимо экспортировать в png-sequence, вам необходимо пройтись по всем кадрам экспортировать каждый кадр в png файл. 

## Экспорт из swf
Когда проект живет очень долго, к сожалению иногда случается печаль, и исходники могут быть утеряны. Так вот если у вас нет исходного .fla файла с изображениями, и вам необходимо вытащить все картинки из скомпилированного swf файла - не расстраивайтесь, проблема решаема. Есть два способа вытащить изображения из swf файла:
1. Экспорт средствами ActionScript
2. Декомпиляция + экспорт из .fla

### Экспорт средствами ActionScript
Ресурс посвящен JavaScript разработке, поэтому я не буду подробно рассказывать как это сделать, дам только подсказку, ну а дальше сами :) в случае проблем - спрашивайте в комментариях. Вам необходимо загрузить флешку, получить список всех внутренних классов методом:
```ActionScript
var classesList:Vector.<String> = loaderInfo.applicationDomain.getQualifiedDefinitionNames();
```
Далее можно пройтись по всем именам классов, создать экземпляр и проверить, если это BitmapData - сделать экспорт:
```ActionScript
var bytes:ByteArray = bitmapData.encode(new Rectangle(0, 0, bitmapData.width, bitmapData.height), new PNGEncoderOptions());
new FileReference().save(bytes);
```

Если же внутри swf лежит MovieClip или Sprite со сложной графикой внутри, и необходимо этот мувик(спрайт) экспортировать в png целиком: вы можете отрисовать этот клип в BitmapData и сохранить как показано выше. Только здесь есть один нюанс, если у вашего MovieClip/Sprite начало координат смещено относительно левого верхнего угла, тогда вам перед отрисовкой в BitmapData необходимо вычислить смещение и применить его в методе BitmapData.draw. Допустим у нас есть вот такой мувиклип: 
{% asset_img export_arrow.png MovieClip %}
Красным крестом показана точка начала координат мувика(спрайта). Как правильно экспортировать такой мувик:

```ActionScript
var clip:MovieClip = new myArrowClip();
// Для начала необходимо положить клип на stage в координаты 0.0
stage.addChild(clip);
clip.x = 0; clip.y = 0;
// вычисляем смещение
var bounds:Rectangle = clip.getBounds(stage);
var matrix:Matrix = new Matrix();
matrix.translate(-bounds.x, -bounds.y);
//
var bitmapData:BitmapData = new BitmapData(clip.width, clip.height, true, 0x00000000);
bitmapData.draw(clip, matrix);
```
Если же у вас MovieClip с анимацией, тогда скорее всего каждый кадр будет иметь свое смещение относительно начала координат. Если вам необходимо такую анимацию экспортировать в png-sequence, тогда вам необходимо вычислить максимальное смещение кадров, а затем применить разницу для всех. Теоретически это не должно вызвать сложностей, если что то не получится - пишите в комментариях или в личке.


### Декомпиляция 
Для декомпиляции вам понадобится декомпилятор. Вы можете использовать любой, я использовал [ffdec](https://www.free-decompiler.com/flash/download/) потому что у него есть возможность запустить декомпиляцию из командной строки, без UI оболочки. К тому же он бесплатный.

```bash
ffdec.sh -export fla $output_dir $input_swf
```

После декомпиляции вы можете скормить полученный .fla скрипту, который экспортирует контент. Если вы будете писать скрипт на <strong>JSFL</strong>, имейте ввиду что для запуска скрипта командной строки из JSFL, можно воспользоваться недокументированной функцией <strong>FLfile.runCommandLine</strong>, которая на входе получает код скрипта(а не путь к файлу!):
```javascript
var ffdec = '/Users/user/Desktop/ffdec/ffdec.sh';
var outDir = '/Users/user/Desktop/out/';
var swfFile = '/Users/user/Desktop/swf/my.swf';
var logFile = '/Users/user/Desktop/log.txt';
//
var decompileScript = 'echo run ffdec >> '+logFile+';';
decompileScript += 'cd '+decDirSh+';'
decompileScript += ffdec+' -export fla '+outDir+' '+swfFile+' >> '+logFile+';'
decompileScript += 'ls >> '+logFile+';';
FLfile.runCommandLine(decompileScript);
```
<div class="warning">
Скрипт выше написан для OSX, если вы используете Windows, вы можете написать .bat скрипт и использовать для декомпиляции <strong>ffdec.exe</strong> вместо <strong>ffdec.sh</strong>.
</div>

## Другие ресурсы
Если вы хотите вытащить из флеша видео и звуки, все это можно сделать аналогично в JSFL. Почитать полную документацию по JSFL можно на [сайте Adobe](http://help.adobe.com/en_US/flash/cs/extend/index.html). Если у вас есть скелетная анимация экспортировать её в png-sequence это решение. К счастью Adobe Animate умеет такие анимации конвертировать JavaScript с помощью фреймворка [createjs](http://www.createjs.com/). В следующей статье я расскажу и покажу на реальном примере как сделать конвертирование скелетной анимации, и подробно расскажу как это автоматизировать с помощью JSFL.
