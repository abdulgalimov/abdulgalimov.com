---
title: Загрузка анимации в JS
date: 2016-12-19 12:22:54
tags:
---

В прошлой статье я рассказывал как можно конвертировать флешовую скелетную анимацию в <strong>HTML5/Canvas</strong> формат, на выходе у нас должен был получится JS файл с описанием анимации, и png атлас для скинования скелетной анимации. Что бы вы лучше понимали что мы будем делать вот пример того что в итоге мы должны получить: 
<div>
        <button class="uiButton" onclick="buttonClick()">Нажми меня</button>
        <canvas width="170" height="240" id="canvas"></canvas>
</div>
<script>
    var jsPath = '{% asset_path lib/egg.js%}'
    var atlasPath = '{% asset_path lib/egg.png%}'
    function buttonClick()
    {
        try {
            if (!eggObj.isDie) {
                eggObj.isDie = true;
                eggObj.gotoAndPlay('die');
            } else {
                eggObj.isDie = false;
                eggObj.gotoAndPlay('idle');
            }
        } catch (error) {
            alert('Анимация еще не загружена');
        }
    }
</script>
<script defer src="https://code.createjs.com/createjs-2015.11.26.combined.js"></script>
<script defer src="{% asset_path lib/app.js%}"></script>

Собирается такая анимация на JavaScript из двух файлов:
* {% asset_link lib/egg.js JS файл %} с описанием скелета анимации</li>
* {% asset_link lib/egg.png png %} скин для скелета</li>

Как это загрузить в и отобразить в браузере, читайте далее...

<!-- more -->

И так, у нас есть JS файл и атлас, как это загрузить в браузер и отобразить на Canvas? Вот полный код примера с яйцом:
```JavaScript
var stage = new createjs.Stage(document.getElementById("canvas"));
createjs.Ticker.framerate = 30;
createjs.Ticker.addEventListener("tick", stage);
//
var shape = new createjs.Shape();
shape.graphics.beginFill('#aaaaaa');
shape.graphics.drawRect(0, 0, 170, 240);
stage.addChild(shape);
//
var loaderEgg = document.createElement('script');
document.getElementsByTagName('head')[0].appendChild(loaderEgg);
loaderEgg.src = jsPath;
loaderEgg.view = this;
var loaderManifest;
loaderEgg.onload = function()
{
    eggLib = window['lib_egg'];
    // записываем в манифест путь полный до картинки атласа
    eggLib.properties.manifest[0].src = atlasPath;
    loaderManifest = new createjs.LoadQueue(false);
    loaderManifest.addEventListener("complete", onLoadedManifest);
    loaderManifest.loadManifest(eggLib.properties.manifest);
}
//
var eggLib;
var eggObj;
function onLoadedManifest(evt)
{
    var queue = evt.target;
    var ssMetadata = eggLib.ssMetadata;
    var ssLoader;
    var item;
    for(var i=0; i<ssMetadata.length; i++) {
        item = ssMetadata[i];
        var result = queue.getResult(item.name);
        eggLib._images[item.name] = result;
        if (!result) continue;
        eggLib._ss[ssMetadata[i].name] = new createjs.SpriteSheet( {"images": [result], "frames": ssMetadata[i].frames} );
    }
    //
    eggObj = new eggLib.animation();
    // функция this.TURN() будет вызвана
    // в конце проигрывания анимации 'die'
    eggObj.TURN = function() {
        eggObj.stop();
    }
    eggObj.x = 185;
    eggObj.y = 130;
    stage.addChild(eggObj);
}

function buttonClick()
{
    try {
        if (!eggObj.isDie) {
            eggObj.isDie = true;
            eggObj.gotoAndPlay('die');
        } else {
            eggObj.isDie = false;
            eggObj.gotoAndPlay('idle');
        }
    } catch (error) {
        alert('Анимация еще не загружена');
    }
}
```