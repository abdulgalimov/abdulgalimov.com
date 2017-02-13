---
title: Примеры шейдеров для Cocos2d-JS
date: 2017-02-12 21:09:01
tags:
    - Cocos2d
    - shader
    - GLSL
category: Cocos2d
---

Всем привет. Будучи флешером, меня всегда волновала тема написания шейдеров, к сожалению на флеше не было возможности писать полноценные шейдеры, только AGAL-жалкое подобие. В webgl вы можете и должны писать шейдеры на языке [GLSL](https://ru.wikipedia.org/wiki/OpenGL_Shading_Language). В каждой библиотеке, будь то Cocos2d или PIXI, существуют свои небольшие правила и соглашения, которым надо следовать для написания шейдера. В этой статье я хочу показать несколько примеров того, как написать шейдер для фреймфорка Cocos2d-JS. Будут рассмотрены примеры реализации следующих фильтров:

1. [Grayscale](/Cocos2d/Shader-Examples/#Grayscale)
2. [Blur](/Cocos2d/Shader-Examples/#Blur)
3. [Outline](/Cocos2d/Shader-Examples/#Outline)
4. [Glow](/Cocos2d/Shader-Examples/#Glow)
5. [Dropshadow](/Cocos2d/Shader-Examples/#Dropshadow)
6. [Demo](/Cocos2d/Shader-Examples/#Demo)

Чтобы легче было представить чем будем заниматься, вот превью фильтров:

{% asset_img preview.png %}

Если вам лень читать нудятину которую я тут собираюсь писать, и вам легче воспринимать информацию читая код, вот репозиторий с готовым проектом: https://github.com/abdulgalimov/Cocos2d-Shader-Examples . Только имейте ввиду, что коды шейдеров в этом примере написаны для изучения темы и они написаны довольно универсально, что, как правило, приводит к падению производительности, поэтому для использования в продакшине желательно их немного оптимизировать для конкретных нужд.

<!-- more -->

<a name="Grayscale"></a>
# Grayscale

## Вершинный

```glsl
attribute vec4 a_position;
attribute vec2 a_texCoord;

#ifdef GL_ES
varying mediump vec2 v_texCoord;
#else
varying vec2 v_texCoord;
#endif

void main()
{
    gl_Position = (CC_PMatrix) * a_position;
    v_texCoord = a_texCoord;
}
```

Здесь стоит обратить внимание на присутствие переменной **CC_PMatrix**, его не нужно объявлять, его добавит сам **Cocos2d** при компиляции шейдера.

## Фрагментный 
```glsl
#ifdef GL_ES
precision lowp float;
#endif

varying vec2 v_texCoord;

void main(void) {
    vec4 texColor = texture2D(CC_Texture0, v_texCoord);
    float gray = texColor.r * 0.299 + texColor.g * 0.587 + texColor.b * 0.114;
    gl_FragColor = vec4(gray, gray, gray, texColor.a);
}
```

Здесь также присутствует переменная от cocos-а **CC_Texture0** которая ссылается на базову текстуру. Для вычисления цвета пикселя используем [стандартные коэффициенты](https://ru.wikipedia.org/wiki/Оттенки_серого). Поигравшись с коеффициентами можно получить эффект **sepia**.

## JavaScript

Для применения этого шейдера к спрайту, используйте код:
```JS
// создаем шейдерную программу
var program = new cc.GLProgram(res['shaders/GrayScale.vsh'], res['shaders/GrayScale.fsh']);
program.addAttribute(cc.ATTRIBUTE_NAME_POSITION, cc.VERTEX_ATTRIB_POSITION);
program.addAttribute(cc.ATTRIBUTE_NAME_COLOR, cc.VERTEX_ATTRIB_COLOR);
program.addAttribute(cc.ATTRIBUTE_NAME_TEX_COORD, cc.VERTEX_ATTRIB_TEX_COORDS);
program.link();
program.updateUniforms();


// применяем шейдер к спрайту
var sprite = new cc.Sprite(res.image_png);
sprite.shaderProgram = program;
```

<a name="Blur"></a>
# Blur

Вершийнный шейдер такой же как и у эффекта **grayscale**.

## Фрагментный
```glsl
precision mediump float;
uniform float radius;
uniform float tx;
uniform float ty;
varying vec2 v_texCoord;

void main(void) {
    vec4 sumCoolor = texture2D(CC_Texture0, v_texCoord);
    if (radius > 0.0) {
        const float maxRadius = 20.0;
        float count = 0.0;
        vec2 coord;
        for (float i=-maxRadius; i<maxRadius; i += 1.0 ) {
            if (i < -radius || i > radius) continue;
            for (float j=-maxRadius; j<maxRadius; j += 1.0 ) {
                if (j < -radius || j > radius) continue;
                float cx = i * tx + v_texCoord.x;
                float cy = j * ty + v_texCoord.y;
                sumCoolor += texture2D(CC_Texture0, vec2(cx, cy));
                count += 1.0;
            }
        }
        sumCoolor /= count;
    }
    //
    gl_FragColor = sumCoolor;
}
```
Здесь сделать немного пояснений. Во первых для получения эффекта размытия необходимо взять какое то количество соседних пикселей и вычислить среднее значение цвета. Существует множество разных алгоритмов для получения эффекта размытия, здесь я взял самый примитивный, просто беру всех соседей в определенном радиусе и определяю среднее значение цвета.

Обратите внимание на переменную _maxRadius_, которая используется в 15 и 17 строке и на проверку с переменной _radius_:
`if (i < -radius || i > radius)`, здесь эта проверка необходима потому что в webgl вы не можете использовать в цикле for переменные которые не являются константами, поэтому здесь был использован вот такой костыль. Конечно для использования в реальном проекте лучше этот код собрать из строки программно и на месте переменной **maxRadius** сразу использовать числовую константу, ну и помните, что чем больше радиус сглаживания, чем больше нагрузки на GPU во время выполнения шейдера.

Переменные **tx** и **ty** - это размер одного пикселя изображения. Т.к. текстурные координаты всегда задаются в от 0 до 1, не зависмо от размера текстуры, то для задания шага в 1 пиксель, используются значения: `1/width` и `1/height` для x и y соответственно, где **width** и **height** размеры текстуры.

## JS

```JS
var sprite = new cc.Sprite(res.image_png);
this.addChild(sprite);
//
var width = sprite.getContentSize().width;
var height = sprite.getContentSize().height;
var tx = 1/width;
var ty = 1/height;
var radius = 5;
//
var program = new cc.GLProgram(res['shaders/Blur.vsh'], res['shaders/Blur.fsh']);
program.addAttribute(cc.ATTRIBUTE_NAME_POSITION, cc.VERTEX_ATTRIB_POSITION);
program.addAttribute(cc.ATTRIBUTE_NAME_COLOR, cc.VERTEX_ATTRIB_COLOR);
program.addAttribute(cc.ATTRIBUTE_NAME_TEX_COORD, cc.VERTEX_ATTRIB_TEX_COORDS);
program.link();
program.updateUniforms();
program.setUniformLocationWith1f(program.getUniformLocationForName('radius'), radius);
program.setUniformLocationWith1f(program.getUniformLocationForName('tx'), tx);
program.setUniformLocationWith1f(program.getUniformLocationForName('ty'), ty);
//
sprite.shaderProgram = program;

```

<a name="Outline"></a>
<a name="Glow"></a>
<a name="Dropshadow"></a>
# Outline, Glow, Dropshadow

Эффекты **Outline**, **Glow** и **Dropshadow** я реализовал в одном шейдере, который можно конфигурировать параметрами. Конечно прежде чем использовать это в реальном проекте, лучше подумать какие параметры вам не нужны и их можно исключить.

Вершийнный шейдер такой же как и у эффекта **grayscale**.

## Фрагментный
```glsl
precision mediump float;
uniform float radius;
uniform float x;
uniform float y;
uniform float tx;
uniform float ty;
uniform float alpha;
uniform float threshold;
uniform float red;
uniform float green;
uniform float blue;
varying vec2 v_texCoord;

void main(void) {
    vec4 texColor = texture2D(CC_Texture0, v_texCoord);
    vec4 outColor;
    if (texColor.a == 1.0) {
        outColor = texColor;
    } else {
        vec2 texCoord = v_texCoord + vec2(x, y);
        vec4 shadowColor = texture2D(CC_Texture0, texCoord);
        float _alpha = 0.0;
        if (radius > 0.0) {
            const float maxRadius = 20.0;
            _alpha = 0.0;
            float count = 0.0;
            vec2 tempCoord = vec2(0.0);
            for (float i=-maxRadius; i<maxRadius; i += 1.0 ) {
                if (i <= -radius || i >= radius) continue;
                tempCoord.x = i * tx + texCoord.x;
                for (float j=-maxRadius; j<maxRadius; j += 1.0 ) {
                    if (j <= -radius || j >= radius) continue;
                    tempCoord.y = j * ty + texCoord.y;
                    _alpha += texture2D(CC_Texture0, tempCoord).a;
                    count += 1.0;
                }
            }
            _alpha /= count;
        }
        _alpha = min(_alpha*threshold, 1.0) * alpha;
        if (_alpha > 0.0) {
            outColor = vec4(red, green, blue, _alpha);
            outColor = outColor*(1.0-texColor.a) + texColor*texColor.a;
        } else {
            outColor = vec4(red, green, blue, texColor.a);
        }
    }
    gl_FragColor = outColor;
}

```

Здесь также присутствует костыль с переменной **maxRadius** которую лучше заменить программно на числовую константу с нужным радиусом. Для реализации используется среднее значение alpha в определенном радиусе вокруг текущей точки со смещением, заданым в параметрах `x,y`.  Самое интересное в строке 43, здесь мы высчитываем средний цвет между тенью и оригинальным пикселем используя в качестве коэффициента значение alpha исходного пикселя. Это нужно для того чтобы правильно перемешать цвета там, где в исходном изображении полупрозраные пиксели.

## JS

```JS
function createProgram(tw, th, options) {
    options = options||{};
    var angle = options.hasOwnProperty('angle') ? +options.angle : Math.PI/4;
    var radius = options.hasOwnProperty('radius') ? +options.radius : 5;
    var alpha = options.hasOwnProperty('alpha') ? +options.alpha : 0.6;
    var distance = options.hasOwnProperty('distance') ? +options.distance : 20;
    var threshold = options.hasOwnProperty('threshold') ? +options.threshold : 1;
    var color = options.hasOwnProperty('color') ? +options.color : 0x0;
    //
    var tx = 1/w;
    var ty = 1/h;
    var x = tx * distance*Math.cos(angle+Math.PI);
    var y = ty * distance*Math.sin(angle+Math.PI);
    var red = (color >> 16 & 0xff)/255;
    var green = (color >> 8 & 0xff)/255;
    var blue = (color & 0xff)/255;
    //
    var program = new cc.GLProgram(res['shaders/DropShadow.vsh'], res['shaders/DropShadow.fsh']);
    program.addAttribute(cc.ATTRIBUTE_NAME_POSITION, cc.VERTEX_ATTRIB_POSITION);
    program.addAttribute(cc.ATTRIBUTE_NAME_COLOR, cc.VERTEX_ATTRIB_COLOR);
    program.addAttribute(cc.ATTRIBUTE_NAME_TEX_COORD, cc.VERTEX_ATTRIB_TEX_COORDS);
    program.link();
    program.updateUniforms();
    program.setUniformLocationWith1f(program.getUniformLocationForName('radius'), radius);
    program.setUniformLocationWith1f(program.getUniformLocationForName('x'), x);
    program.setUniformLocationWith1f(program.getUniformLocationForName('y'), y);
    program.setUniformLocationWith1f(program.getUniformLocationForName('tx'), tx);
    program.setUniformLocationWith1f(program.getUniformLocationForName('ty'), ty);
    program.setUniformLocationWith1f(program.getUniformLocationForName('alpha'), alpha);
    program.setUniformLocationWith1f(program.getUniformLocationForName('threshold'), threshold);
    program.setUniformLocationWith1f(program.getUniformLocationForName('red'), red);
    program.setUniformLocationWith1f(program.getUniformLocationForName('green'), green);
    program.setUniformLocationWith1f(program.getUniformLocationForName('blue'), blue);
    //
    return program;
}



var sprite =new cc.Sprite(res.image_png);
this.addChild(sprite);
var textureWidth = sprite.getContentSize().width;
var textureHeight = sprite.getContentSize().height;
// опции для эффекта Outline color
var outlineOptions = {
    distance:0,
    threshold:30,
    radius:7,
    alpha:1,
    color:0xff0000
};
sprite.shaderProgram = createProgram(textureWidth, textureHeight, options);
sprite.setBlendFunc(cc.BlendFunc.ALPHA_NON_PREMULTIPLIED);
```

Обратие внимание на вызов метода `setBlendFunc`, он здесь обязателен для правильного отображения прозрачных цветных пикселей. Если вы получили картинку вроде такой:
{% asset_img error_blend.png %}
значит скорее всего вы забыли вызвать метод:
```JS
sprite.setBlendFunc(cc.BlendFunc.ALPHA_NON_PREMULTIPLIED);
```


Опции для создания эффекта Glow:
```JS
var glowOptions = {
    distance:0,
    radius:15,
    alpha:1,
    color:0xffff00
};
```
и для Dropshadow:
```JS
var shadowOptions = {
    distance:20,
    radius:3,
    alpha:.5,
    color:0x0,
    angle:Math.PI/4
};
```

<a name="Demo"></a>
# Demo
<iframe width="100%" height="400" src="{% asset_path lib/index.html %}"></iframe>

Ссылки:
 - <a target="_blank" href="https://github.com/abdulgalimov/Cocos2d-Shader-Examples">Исходники cocos-проекта на GitHub</a>
 - <a target="_blank" href="{% asset_path lib/app.zip %}">Исходники скомпилированного Demo</a>
 - <a target="_blank" href="{% asset_path lib/index.html %}">Посмотреть Demo в новом окне</a>


