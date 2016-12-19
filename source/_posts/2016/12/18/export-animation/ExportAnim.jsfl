
fl.outputPanel.clear();
function trace() {
	var m = '';
	for (var i = 0; i < arguments.length; i++) m += arguments[i] + " ";
	fl.trace(m);
}
var test = false;
fl.showIdleMessage(false);

function getDirPath(filename)
{
	var arr = filename.split('/');
	arr.splice(-1);
	return arr.join('/');
}


var sourceDoc = fl.getDocumentDOM();
var prepareDoc;
var prepareLib;
var reg4CyrillicDetect = /[а-яА-Я]/g;
var fullNameAnim = 'EggAnimation';
function prepareFile() {
	//
	var preparePath = getDirPath(sourceDoc.pathURI)+'/_prepare.fla';
	if (FLfile.exists(preparePath)) FLfile.remove(preparePath);
	FLfile.copy(sourceDoc.pathURI, preparePath);
	prepareDoc = fl.openDocument(preparePath);
	prepareLib = prepareDoc.library;
	//
	var moviesCash = {};
	var item;
	var items = prepareLib.items.slice();
	for (var i = 0; i < items.length; i++) {
		item = items[i];
		//
		reg4CyrillicDetect.lastIndex = 0;
		if (reg4CyrillicDetect.test(item.name)) {
			item.name = 'i' + i;
		}
		if (item.linkageClassName == 'animation') {
			fullNameAnim = item.name;
			convertShapesToBitmap(item);
			continue;
		}
		//
		switch (item.itemType) {
			case 'movie clip':
			case 'graphic':
				moviesCash[item.name] = item;
				convertShapesToBitmap(item);
				break;
		}
	}
	//
	prepareDoc.exitEditMode();
	//
	fl.saveDocument(prepareDoc);
	//prepareDoc.close(false);
}
function convertShapesToBitmap(item) {
	trace('convertShapesToBitmap:', item.name);
	prepareLib.editItem(item.name);
	var timeline = prepareDoc.getTimeline();
	var count = timeline.layerCount;
	for (var i = 0; i < count; i++) {
		var layer = timeline.layers[i];
		if (layer.layerType == 'folder') continue;
		if (!layer.visible || layer.layerType == 'mask') {
			timeline.deleteLayer(i);
			count--;
			i--;
		} else {
			layer.visible = false;
		}
	}
	//
	for (var i = 0; i < count; i++) {
		var layer = timeline.layers[i];
		//if (layer.name != 'nnoovvii') continue;
		if (layer.layerType == 'guide') continue;
		layer.visible = true;
		layer.locked = false;
		layer.outline = false;
		//
		for (var j = 0; layer.frames && j < layer.frames.length; j++) {
			timeline.currentFrame = j;
			//
			var frame = layer.frames[j];
			for (var k = 0; k < frame.elements.length; k++) {
				var element = frame.elements[k];
				element.locked = false;
				prepareDoc.selection = [element];
				//
				if (element.elementType == 'shape') {
					prepareDoc.convertSelectionToBitmap();
				}
			}
		}
		layer.visible = false;
	}
	for (var i = 0; i < count; i++) timeline.layers[i].visible = true;
}

function convertToCanvas()
{
	var res = fl.copyLibraryItem(prepareDoc.pathURI, fullNameAnim);
	var canvasDoc = fl.createDocument('htmlcanvas');
	canvasDoc.clipPaste();
	//
	var canvasPath = getDirPath(sourceDoc.pathURI)+'/_canvas.fla';
	if (FLfile.exists(canvasPath)) FLfile.remove(canvasPath);
	fl.saveDocument(canvasDoc, canvasPath);
}

if (sourceDoc) {
	prepareFile();
	convertToCanvas();
} else {
	alert('Нет открытых документов');
}