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
var rootCont = document.getElementsByTagName('head')[0];
rootCont.appendChild(loaderEgg);
loaderEgg.src = jsPath;
loaderEgg.view = this;
loaderEgg.onload = function()
{
	eggLib = window['lib_egg'];
	eggLib.properties.manifest[0].src = atlasPath;
	loaderManifest = new createjs.LoadQueue(false);
    loaderManifest.addEventListener("complete", onLoadComplete);
    loaderManifest.loadManifest(eggLib.properties.manifest);
}
var eggLib;
var loaderManifest;
var eggObj;
function onLoadComplete(evt)
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
        var image = new createjs.SpriteSheet( {"images": [result], "frames": ssMetadata[i].frames} );
        eggLib._ss[ssMetadata[i].name] = image;
    }
    //
    eggObj = new eggLib.egg();
    eggObj.TURN = function()
	{
		eggObj.stop();
	}
    eggObj.x = 185;
    eggObj.y = 130;
    stage.addChild(eggObj);
}