---
title: Экспорт анимации
date: 2016-12-18 18:39:39
tags:
category: convert
---

В прошлой статье мы разбирали как экспортировать из флеша простой контент: изображения, анимации в png-sequence, и т.п. Если же у вас есть скелетная анимация, с большим количеством кадров, экспортировать такую анимацию в png-sequence - это не решение проблемы. В этой ситуации мы можем конвертировать анимацию в <strong>HTML5/Canvas</strong> с помощью <strong>Adobe Animate</strong>. Что бы вы лучше понимали что мы будем делать вот пример того что в итоге мы должны получить: 
<div>
		<button class="uiButton" onclick="buttonClick()">Нажми меня</button>
		<canvas width="170" height="240" id="canvas"></canvas>
</div>
<script>
	var jsPath = '{% asset_path egg.lib%}'
	var atlasPath = '{% asset_path egg.png%}'
	function buttonClick()
	{
		try {
			eggObj.gotoAndPlay('die');
		} catch (error) {
			alert('Анимация еще не загружена');
		}
	}
</script>
<script defer src="https://code.createjs.com/createjs-2015.11.26.combined.js"></script>
<script defer src="{% asset_path app.lib%}"></script>

Собирается такая анимация на JavaScript из двух файлов:
* {% asset_link egg.lib JS файл %} с описанием скелета анимации</li>
* {% asset_link egg.png png %} скин для скелета</li>

Это анимация была создана для использования во флеше, и нарисована была в редакторе Adobe Flash Professional(напомню что новое название редактора Adobe Animate). Как сделать такую конвертацию, читайте дальше...

<!-- more -->

Рассмотрим для начала с чем имеем дело: {% asset_link original.fla original.fla %} исходный файл, в нем анимация которая изначально создавалась для загрузки во флешь игру, откройте его и посмотрите с чем имеем дело. В библиотеке есть клип EggAnimation, обратите внимание на слой <em>labels</em>, на котором в конце анимации(кадр 75) написан код `gotoAndPlay('idle');` для зацикливания анимации <em>idle</em>, и в конце анимации <em>die</em> код `TURN();`

Для конвертации руками выберите пункт меню `Convert -> Convert To Other Document Formats`, выберите в выпадающем списке <strong>HTML5 Canvas</strong> и нажмите OK, будет создан новый документ с именем original_Canvas.fla, который визуально будет выглядеть так же как и исходный. Что произошло? Adobe Animate конвертировал все для создания Canvas документа, заодно закоментировал весь ActionScript код на Timeline, в том числе тот что был на слое <em>labels</em>. Раскомментируйте код gotoAndPlay('idle') добавив в начало слово <em>this</em>, чтобы получилось: `this.gotoAndPlay('idle');`, далее вытащите клип EggAnimation на stage и скомпилируйте fla файл. Будет запущен браузер с анимацией в JavaScript. Если вы видите что то вроде этого:
{% asset_img CanvasError.jpg %}
просто обновите страницу и анимация будет отображена как положено, далее я расскажу почему так происходит и как это исправить. А теперь откройте каталоге где у вас лежит файл original_Canvas.fla, там вы увидите созданные файлы:
1. <strong>images/original_Canvas\_atlas\_.png</strong> - Атлас с картинками используемыми в скелете анимации
2. <strong>original_Canvas.js</strong> - Библиотека JS для создания эксзепляра анимации, если хотите там описан класс анимации
3. <strong>original_Canvas.html</strong> - Пример кода как загрузить эту анимацию, имейте ввиду код для загрузки здесь будет только в том случае, если вы переместили клип EggAnimation на stage.

Изучите содержимое .html файла, там пример того как можно загрузить JS-анимацию в Canvas. Гораздо интереснее содержимое файла `original_Canvas.js`, в нем описана вся анимация и класс, используя который можно будет создавать сколько угодно экземпляров в своем коде. Самое важное в этом файле в самом конце:
```javascript
})(lib = lib||{}, images = images||{}, createjs = createjs||{}, ss = ss||{}, AdobeAn = AdobeAn||{});
var lib, images, createjs, ss, AdobeAn;
```
Здесь создаются объекты:
* lib - библиотека(другими словами класс), в котором будет описана вся анимация.
* images - объекта в котором будут лежать загруженные изображения, в данном случае атлас скина
* ss - объект где будут лежать созданные [SpriteSheat](http://www.createjs.com/docs/easeljs/classes/SpriteSheet.html) (объект фреймворка <strong>createjs</strong>)
* createjs и AdobeAn - системные, и нам не интересны.

Объекты lib, images и ss будут созданые для каждого файла с анимацией который вы будете загружать, и они могут конфликтовать друг с другом, чтобы этого не было, необходимо их переименовать, например испльзуя id объекта, или имя файла(на ваше усмотрение), в моем случае может получится так:
```javascript
})(lib_egg = lib_egg||{ss:{}, images:{}}, lib_egg.images, createjs = createjs||{}, lib_egg.ss, AdobeAn = AdobeAn||{});
var lib_egg, createjs, AdobeAn;
```
Что я сделал? создал файл библиотеку `lib_egg` а внутри него объекты `ss` и `images`, это удобно потому что вся информация об одной анимации будет лежать в одном объекте lib_egg. Но будьте осторожные, если у вас во fla в библиотеке есть элементы с именами ss и images, они будут конфликтовать. Вы можете эти действия производить в JSFL скрипте который будет конвертировать вашу анимацию. Не пугайтесь размера этого файла, вам с ним больше ничего не придется делать, это всего лишь статика, которую вам надо загрузить как обычный JS-файл и создать экземпляр анимации. Как это сделать я покажу в следующей статье. Сейчас еще пару слов о конвертировании.

## Немного о конвертировании

### Проблема с векторной графикой
Откройте файл original_Canvas.js и найдите там строчки вида: 
```ActionScript
this.shape = new cjs.Shape();
this.shape.graphics.f("#BBD729").s().p("AirFDQAAgCAEgDQAFgEAAgCIACgEIAAgEIgBgZIABgMIABgCIAAg1IgBgMIABhpIgCgUIAAiBIgBhvIAAh/IABAAIADB4IACAbIAEAFQAJAGAIAAQAvAAAfhIIAQg4IADhEIACAAIgCAYIABAiIABgEIgCAVIABAHIADBVQAEBpACANIAAB5IAEAoIAEApIAAAJQgBAHgGgBQgCABgDgHQgFAAgBgKIAAgLQAAgIACgHQgCggACgZIAAh1QgCgKgDgcQgCgbAAgRIAChyQgGAQgIATQggBJgjAAQgUAAgKgHIgEgEIACBdIAAB6IABATIAABaQAFA6ABAWIADAXIAAABIACAQQAAAHgBAFIAAACQAFAAAFADQAGADABAEQgBAEgDACIgQAAQgZAAAAgIgACJEUQAAgGANgBIAAgVIAAiJIACAPIABCOIABAAQARABAAAGQAAAEgDABQgFACgLAAQgPAAAAgGg");
```
Это укороченный base64 кода, похожего на вот такой:
```ActionScript
this.shape = new cjs.Shape();
this.shape.graphics.beginFill("rgba(255,255,255,0.796)").beginStroke().moveTo(3.6,23.4).curveTo(5,22.2,5.5,21.6).lineTo(5.6,21.5).curveTo(6,21.9,5,23.1).curveTo(4.9,23.4,4.4,23.7).lineTo(3.6,24).closePath().moveTo(-20.9,18.9).curveTo(-20.9,18.9,-20.9,18.8).curveTo(-21,18.7,-21,18.7).curveTo(-21,18.6,-21,18.6).curveTo(-21,18.5,-20.9,18.5).curveTo(-19.6,18.3,-17.8,17.7).curveTo(-14.5,16.9,-11.9,14.9).lineTo(-12.2,15.2).curveTo(-13.2,16.7,-16.7,18.1).curveTo(-19.2,19.1,-20.3,19.1).curveTo(-20.7,19.1,-20.9,18.9).closePath().moveTo(4.5,0.1).curveTo(7.3,-0.9,7.4,-0.8).lineTo(7.5,-0.8).lineTo(7.1,-0.4).curveTo(6.8,0.2,6,0.4).lineTo(5.4,0.5).curveTo(4.8,0.5,4.5,0.1).closePath().moveTo(19.2,-1.3).curveTo(19.1,-2.3,20.4,-4.1).lineTo(20.6,-4.2).curveTo(21.2,-3.9,20.9,-3.4).lineTo(20.2,-2.2).curveTo(19.7,-1.5,19.4,-1.3).closePath().moveTo(10.1,-21).curveTo(9.8,-21.4,9.7,-22.6).lineTo(9.6,-23.7).lineTo(9.8,-24).curveTo(10.4,-23.1,10.6,-20.9).lineTo(10.4,-20.9).lineTo(10.1,-21).closePath();
this.shape.setTransform(-127.4,-11.1);
```

Т.е. здесь JavaScript рисует векторную графику, с помощью кода который закодирован в base64 для уменьшения объема файла. Не трудно догадаться что такое создание файла будет очень накладно в процессе выполнения. Чтобы такого не было, лучше всю векторную графику во fla конвертировать в bitmap. Лучше всего это делать с помощью JSFL скрипта, вот пример как это можно сделать:
```javascript
var sourceDoc = ... // Текущий документ
var sourceLib = ... // Элемент библиотеки который необходимо оптимизировать
sourceLib.editItem(item.name);
var timeline = sourceDoc.getTimeline();
for (var i = 0; i < timeline.layerCount; i++) {
	var layer = timeline.layers[i];
	if (layer.layerType == 'folder' || !layer.frames) continue;
	for (var j = 0; j < layer.frames.length; j++) {
		timeline.currentFrame = j; // переходим к кадру
		var frame = layer.frames[j];
		for (var k = 0; k < frame.elements.length; k++) {
			var element = frame.elements[k];
			sourceDoc.selection = [element]; // выделяем элемент
			if (element.elementType == 'shape') { // если это векторая графика
				sourceDoc.convertSelectionToBitmap(); // конвертируем в bitmap
			}
		}
	}
}
```
Метод <strong>convertSelectionToBitmap()</strong> конвертирует выделенные элементы в bitmap и заменяет их, удаляя со stage все выделенное, т.е. визуально вы не заметите разницы.

Могут быть проблемы с маской наложенной на MovieClip. В библиотеке <strong>createjs</strong> маска работает только если закешировать(метод [DisplayObject.cache()](http://www.createjs.com/docs/easeljs/classes/DisplayObject.html#method_cache)) маскируемый объект, а если мы маскируем анимацию, необходимо обновлять кешь(метод [DisplayObject.updateCache()](http://www.createjs.com/docs/easeljs/classes/DisplayObject.html#method_updateCache)) каждый кадр. При конвертировании маски, метод `cache()` вызывается один раз при создании, поэтому маска для статичных объектов работает, а вот обновление кеша для анимаций почему то не происходит, вы можете дописать это самому, либо переделать анимацию без маски.


Все кирилические символы присутствующие в именах слоев или в библиотеке во fla необходимо заменить на имена, валидные для имен переменных в JavaScript. В своих скриптах я решил не париться и просто все имена слоев заменяю на layer_\{index\}. Вы можете сделать это свое усмотрение, главное чтобы имена были валидными, т.к. на основе слоев и элементов библиотеки, создаются переменные в JavaScript.


Также могут возникнуть сложности с эффектами которые создаются во FLA, если у вас что то отображается некорректно, попробуйте удалить/заменить их.

### Массовое конвертирование файлов
Ееще одна мелочь, которая мне вынесла мозг в процессе написания скрипта на JSFL. Изначально для конвертирования flash контента в HTML5/Canvas я использовал команду:
```JavaScript
fl.runScript(fl.configURI + 'Commands/Convert to Other Document Formats.jsfl'); 
```
которая открывает модальное окно, как если бы вы вызвали руками пункт меню `Convert -> Convert To Other Document Formats`. Если вы хотите конвертировать этим скриптом массу файлов, это начинает напрягать: сидеть 8 часов подряд и периодически кликать мышкой кнопку ОК - не очень веселое занятие. Чтобы этого избежать, необходимо:

Открыть исходный fla файл, скопировать в буфер обмена элемент библиотеки, который необходимо перенести в JS
```javascript
var fileURI = ... // путь до исходного fla файла
var libraryItemPath = ... // путь до элемента в библиотеке, который мы хотим скопировать
fl.copyLibraryItem(fileURI, libraryItemPath)
```
Чтобы получить libraryItemPath, откройте документ, пройдитесь по всем элементам библиотеки, если `linkageClassName` совпадает с тем что мы ищем, тогда запоминаем полное имя элемента библиотеки (вместе с каталогом, если такой имеется в библиотеке fla).

Далее создать новый HTML5/Canvas документ и вставить элемент из буфера обмена:
```javascript
var canvasDoc = fl.createDocument('htmlcanvas');
canvasDoc.clipPaste();
```

Это будет гораздно быстрее, и к тому же в canvas документ не будут скопированы не нужные элементы библиотеки из исходного FLA файла, если например там есть какие то вспомогательные тестовые элементы в библиотеке(аниматоры любят хранить там всякий хлам).
