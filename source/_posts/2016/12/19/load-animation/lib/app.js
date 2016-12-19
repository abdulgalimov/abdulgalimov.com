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