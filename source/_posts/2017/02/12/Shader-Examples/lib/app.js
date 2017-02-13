/**
 * Created by Zaur abdulgalimov@gmail.com on 12.02.17.
 */


var defaultOptions = {
    Dropshadow: {
        distance:20,
        threshold:20,
        radius:1,
        alpha:0.5,
        color:0x0,
        angle:Math.PI/4
    },
    Outline: {
        distance:0,
        threshold:20,
        radius:7,
        alpha:1,
        color:0xff0000,
        angle:0
    },
    Glow: {
        distance:0,
        threshold:1,
        radius:15,
        alpha:1,
        color:0xffff00,
        angle:0
    },
    Test: {
        distance:0,
        threshold:1,
        radius:0,
        alpha:0,
        color:0xffff00,
        angle:0
    }
}


var image;
var options;
var dropshadow;
function getDropShadow(sprite) {
    if (!dropshadow) {
        dropshadow = new cc.GLProgram(res['shaders/DropShadow.vsh'], res['shaders/DropShadow.fsh']);
        dropshadow.addAttribute(cc.ATTRIBUTE_NAME_POSITION, cc.VERTEX_ATTRIB_POSITION);
        dropshadow.addAttribute(cc.ATTRIBUTE_NAME_COLOR, cc.VERTEX_ATTRIB_COLOR);
        dropshadow.addAttribute(cc.ATTRIBUTE_NAME_TEX_COORD, cc.VERTEX_ATTRIB_TEX_COORDS);
        dropshadow.link();
        //
        dropshadow.options = JSON.parse(JSON.stringify(defaultOptions.Dropshadow));
        //
        dropshadow.data = {
            tx: 1/sprite.getContentSize().width,
            ty: 1/sprite.getContentSize().height
        }
    }
    //
    var tx = dropshadow.data.tx;
    var ty = dropshadow.data.ty;
    //
    var distance = dropshadow.options.distance;
    var radius = dropshadow.options.radius;
    var angle = dropshadow.options.angle;
    var alpha = dropshadow.options.alpha;
    var threshold = dropshadow.options.threshold;
    var x = tx * distance*Math.cos(angle+Math.PI);
    var y = ty * distance*Math.sin(angle+Math.PI);
    var red = (dropshadow.options.color >> 16 & 0xff) / 255;
    var green = (dropshadow.options.color >> 8 & 0xff) /255;
    var blue = (dropshadow.options.color & 0xff)/255;
    //
    dropshadow.updateUniforms();
    dropshadow.setUniformLocationWith1f(dropshadow.getUniformLocationForName('radius'), radius);
    dropshadow.setUniformLocationWith1f(dropshadow.getUniformLocationForName('tx'), dropshadow.data.tx);
    dropshadow.setUniformLocationWith1f(dropshadow.getUniformLocationForName('ty'), dropshadow.data.ty);
    dropshadow.setUniformLocationWith1f(dropshadow.getUniformLocationForName('x'), x);
    dropshadow.setUniformLocationWith1f(dropshadow.getUniformLocationForName('y'), y);
    dropshadow.setUniformLocationWith1f(dropshadow.getUniformLocationForName('alpha'), alpha);
    dropshadow.setUniformLocationWith1f(dropshadow.getUniformLocationForName('threshold'), threshold);
    dropshadow.setUniformLocationWith1f(dropshadow.getUniformLocationForName('red'), red);
    dropshadow.setUniformLocationWith1f(dropshadow.getUniformLocationForName('green'), green);
    dropshadow.setUniformLocationWith1f(dropshadow.getUniformLocationForName('blue'), blue);
    return dropshadow;
}
var grayscale;
function getGrayScale() {
    if (!grayscale) {
        grayscale = new cc.GLProgram(res['shaders/GrayScale.vsh'], res['shaders/GrayScale.fsh']);
        grayscale.addAttribute(cc.ATTRIBUTE_NAME_POSITION, cc.VERTEX_ATTRIB_POSITION);
        grayscale.addAttribute(cc.ATTRIBUTE_NAME_COLOR, cc.VERTEX_ATTRIB_COLOR);
        grayscale.addAttribute(cc.ATTRIBUTE_NAME_TEX_COORD, cc.VERTEX_ATTRIB_TEX_COORDS);
        grayscale.link();
        grayscale.updateUniforms();
    }
    return grayscale;
}
var blurProgram;
function getBlur(sprite) {
    if (!blurProgram) {
        blurProgram = new cc.GLProgram(res['shaders/Blur.vsh'], res['shaders/Blur.fsh']);
        blurProgram.addAttribute(cc.ATTRIBUTE_NAME_POSITION, cc.VERTEX_ATTRIB_POSITION);
        blurProgram.addAttribute(cc.ATTRIBUTE_NAME_COLOR, cc.VERTEX_ATTRIB_COLOR);
        blurProgram.addAttribute(cc.ATTRIBUTE_NAME_TEX_COORD, cc.VERTEX_ATTRIB_TEX_COORDS);
        blurProgram.link();
        blurProgram.updateUniforms();
        //
        blurProgram.data = {
            tx: 1/sprite.getContentSize().width,
            ty: 1/sprite.getContentSize().height
        }
        //
        blurProgram.radius = 5;
    }
    blurProgram.updateUniforms();
    blurProgram.setUniformLocationWith1f(blurProgram.getUniformLocationForName('radius'), blurProgram.radius);
    blurProgram.setUniformLocationWith1f(blurProgram.getUniformLocationForName('tx'), blurProgram.data.tx);
    blurProgram.setUniformLocationWith1f(blurProgram.getUniformLocationForName('ty'), blurProgram.data.ty);
    return blurProgram;
}

var AppLayer = cc.Layer.extend({
    sprite:null,
    ctor:function () {
        this._super();
        //
        var table = new cc.Sprite(res.table_png);
        table.x = cc.winSize.width/2;
        table.y = cc.winSize.height/2;
        this.addChild(table);
        //
        image = new cc.Sprite(res.card_png); 
        image.x = cc.winSize.width/2;
        image.y = cc.winSize.height/2;
        this.addChild(image);
        image.shaderProgram = getDropShadow(image);
        image.setBlendFunc(cc.BlendFunc.ALPHA_NON_PREMULTIPLIED);
        //
        createUI();
    },

});

var AppScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        layer = new AppLayer();
        this.addChild(layer);
    }
});


var UI = {
    dpOptions: {},
    dpDiv: null
};
function updateDropshadowUI() {
    for (var key in dropshadow.options) {
        if (!UI.dpOptions[key]) continue;
        //
        switch (key) {
            case 'angle':
                UI.dpOptions[key].value = dropshadow.options[key]*180/Math.PI;
                break;
            case 'alpha':
                UI.dpOptions[key].value = dropshadow.options[key]*100;
                break;
            case 'color':
                var str = ('000000'+dropshadow.options.color.toString(16)).slice(-6);
                UI.dpOptions[key].jscolor.fromString(str);
                break;
            default:
                UI.dpOptions[key].value = dropshadow.options[key];
                break;
        }
        UI.dpOptions[key].updateLabel();
    }
}
function updateColor(color) {
    var colorNum = parseInt(color.toString(), 16);
    dropshadow.options.color = colorNum;
    getDropShadow();
}
function createUI () {
    UI.dpDiv = document.getElementById('dropshadowDiv');
    for (var key in dropshadow.options) {
        UI.dpOptions[key] = document.getElementById(key);
        if (!UI.dpOptions[key]) continue;
        UI.dpOptions[key].label = document.getElementById(key+'_label');
        UI.dpOptions[key].updateLabel = function() {
            this.label.innerHTML = this.id+' '+this.value;
        }
        //
        UI.dpOptions[key].addEventListener('input', function() {
            var value = UI.dpOptions[this.id].value;
            switch (this.id) {
                case 'angle':
                    dropshadow.options[this.id] = value*Math.PI/180;
                    break;
                case 'alpha':
                    dropshadow.options[this.id] = value/100;
                    break;
                default:
                    dropshadow.options[this.id] = value;
                    break;
            }
            this.updateLabel();
            getDropShadow();
        });
    }
    this.updateDropshadowUI();
    //
    var selectOptions = document.getElementById('selectOptions');
    selectOptions.addEventListener('change', function() {
        switch (this.value) {
            case 'Grayscale':
                image.shaderProgram = getGrayScale();
                UI.dpDiv.style.visibility = 'hidden';
                break;
            case 'Blur':
            UI.dpDiv.style.visibility = 'hidden';
                image.shaderProgram = getBlur(image);
                UI.dpDiv.style.visibility = 'hidden';
                break;
            default:
                UI.dpDiv.style.visibility = 'visible';
                dropshadow.options = JSON.parse(JSON.stringify(defaultOptions[this.value]));
                image.shaderProgram = getDropShadow(image);
                updateDropshadowUI();
                break;
        }
    });
};
