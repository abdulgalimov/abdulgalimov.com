---
title: Cocos2d продолжение знакомства
tags:
category: Cocos2d
---

Эйфория после [первого знакомства с Cocos2d](/Cocos2d/Hello-Cocos2d/) закончилась, новогодние праздники прошли... наступили суровые будни разработчика. В процессе разработки моей первой игры на <strong>Cocos2d JS</strong>, я периодически натыкался на разные проблемы, которые мне показались не очень тривиальными. Попробую рассказать о них: 

1. [Ресурсы и скрипты](/Cocos2d/continue/#res)
2. [Кешь файлов](/Cocos2d/continue/#cache)
3. [Прозрачность дочерних элементов](/Cocos2d/continue/#opacity_child)
4. [HTTP запрос](/Cocos2d/continue/#http)
5. [LongPoll и повторное использование](/Cocos2d/continue/#longpoll)
6. [Переопределение методов кокоса](/Cocos2d/continue/#override)
7. [Анимирование свойства opacity](/Cocos2d/continue/#opacity_anim)
8. [Результат](/Cocos2d/continue/#result)

<!-- more -->

<a name="res"</a>
## Ресурсы и скрипты

Первое что я заметил сразу, это необходимость добавлять загружаемые скрипты и ресурсы в переменную-массив. 
Скрипты в файле project.json:

```json
    "jsList" : [
        "src/resource.js",
        "src/app.js"
    ]
```

и ресурсы в файле src/resource.js:
```json
var res = {
    HelloWorld_png : "res/HelloWorld.png",
};
```
Чтобы руками не добавлять каждый раз новые ресурсы и js-файлы, я написал для себя скрипт на <strong>bash</strong>-e. Все работало как надо, но когда я писал эту статью, я решил переписать <strong>bash</strong>-скрипт на <strong>python</strong>-е, чтобы его можно было запускать и на <strong>Windows</strong>. В итоге наткнулся на следующую проблему: оказывает при загрузке js файлов важен порядок загрузки, и как следствие порядок расположения js-файлов в массиве jsList. Т.е. если у вас в файле `A.js` используются переменные из `B.js`, то файл `B.js` должен быть загружен раньше, а для этого массив jsList должен быть отсортирован соответствующим образом. В итоге в скрипте оставил только обновление ресурсов, а js-файлы добавляю вручную... Но это же JS :) здесь не нужно создавать классы/файлы на каждый чих, и новые файлы создаются не часто, поэтому это не так страшно.


Заметьте что в переменную <strong>res</strong> необходимо добавлять только те ресурсы, которые необходимы на момент старта игры. Остальные при необходимости можно загрузить в процессе. Т.е. если у вас есть ресурсы которые можно загрузить и в процессе, лучше выделить их в отдельный каталог, чтобы не нагружать первый запуск страницы. Это можно сделать например создавать в каталоге ./res/ подкаталог в котором собраны ресурсы необходимые на момент старта игры, и этот каталог скорпить скрипту.

Вот как выглядит скрипт на python для OSX:
```python
import os
import os.path
import re
import json

# можно выбрать подкаталог с ресурсами необходимыми для первого запуска
resDir = 'res'

list={};
for root, subFolder, files in os.walk(resDir):
    for file in files:
    	file_extension = os.path.splitext(file)[1]
        fullPath = os.path.join(root,file)
    	fullName = fullPath[4:];
    	if (file_extension == ".js" or file == ".DS_Store") :
	    	continue;
        list[fullName] = fullPath;

resourceFile = 'src/resource.js';
resFile = open(resourceFile, 'r+');
txt = resFile.read();
txt = re.sub('var\s+res\s+=\s+\{[^\}]*\}', 'var res = '+json.dumps(list), txt);
resFile.seek(0);
resFile.write(txt);
resFile.truncate();
resFile.close();

os.system('cocos run -p web');
```
* В строке 9:`resDir = 'res'` вы можете выбрать подкаталог, в котором у вас собраны те ресурсы, которые необходимы на момент старта игры
* В строке 16: `fullName = fullPath[4:];` я получаю путь до ресурса без имени каталога `res/`, чтобы в коде я мог загружать ресурс используя имя относительно каталога `res/`. Т.е. если у меня картинка лежит в каталоге `res/menu/back.png`, для загрузки я пишу код:
```
var background = new cc.Sprite(res['menu/back.png']);
```


<a name="cache"</a>
## Кешь файлов

Честно говоря, сразу после знакомства с Cocos2d, я не стал тратить время на такие "мелочи" как настройки и чтение документации, и сразу приступил к написанию кода. После перезапуска, в браузере приходилось чистить кешь чтобы увидеть изменения. Какое то время спустя мне это надоело, и я нашёл в файле <strong>project.json</strong> настройку <strong>noCache</strong>. Установите в значение <em>true</em> если планируете активно тестировать в браузере.

<a name="opacity_child"</a>
## Прозрачность дочерних элементов

Допустим есть у вас `cc.Sprite`, внутри которого лежат другие элементы. Если вам необходимо применить ко всему спрайту-контейнеру прозрачность, необходимо применить это ко всем дочерним элементам отдельно, например можно переопределить метод setOpacity
```JavaScript
setOpacity: function(value) {
    for (var i=0; i<this.children.length; i++) {
        this.children[i].setOpacity(value);
    }
}

```

## Компиляция в другие платформы

Тестировать в браузере проще всего, т.к. не тратится время на компиляцию в нативный язык. Но, написав и протестировав немного кода, я решил попробовать скомпилить десктоп версию:
```bash
cocos run -p mac
```

С досадой обнаружил что приложение работает не так, как в браузере. Как выяснилось есть несколько нюансов которые необходимо учитывать, если вы в конечном итоге планируете делать нативную сборку. Дальше я вам расскажу обо все проблемах с которыми я столкнулся, но все же рекомендую периодически делать нативные сборки и тестировать на всех целевых платформах самостоятельно. Чем раньше вы найдёте ошибку, тем лучше.

<a name="http"</a>
### HTTP запрос

Изначально для запросов на сервер игры я использовал JS объект <strong>XMLHttpRequest</strong>, и в браузере все работало:
```javascript
var request = new XMLHttpRequest();
request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
request.addEventListener('readystatechange', function() {
	if (this.request.readyState != 4) return;
	console.log('response:', this.request.responseText);
});
request.open("GET", url, true);
request.send();
```

Но при компиляции под Mac увидел ошибку 
```
addEventListener is not a function
```
Под mac http запрос необходимо делать так:
```javascript
var request = cc.loader.getXMLHttpRequest();
request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
request.onreadystatechange = function() {
	if (this.request.readyState != 4) return;
	console.log('response:', this.request.responseText);
};
//
request.open("GET", url, true);
request.send();
```
Обратите внимание что лоадер создаётся через объек `cc.loader`, и для прослушки используется `onreadystatechange` вместо `addEventListener`. Еще у объекта `cc.loader` есть куча других методов, для загрузки JSON, картинок, JS-кода...

<a name="longpoll"</a>
### LongPoll и повторное использование 

Для получения данных из <strong>longpoll</strong> я пробовал повторно использовать объект создаваемый в `cc.loader.getXMLHttpRequest()`, но в момент выполнения на маке приложение крашилось с ошибкой в консоли:
```
incorrect checksum for freed object - object was probably modified after being freed.

*** set a breakpoint in malloc_error_break to debug

Error running command, return code: -6.
```

Как выяснилось, повторно использовать объект loader нельзя, надо создавать новый. Правда я пока не понял как это будет сказываться на утечке памяти, надо будет отдельно протестировать, если кто имеет информацию по этому поводу, поделитесь в коментах.

<a name="override"</a>
### Переопределение методов кокоса

В Cocos2d JS некоторые методы можно и нужно переопределять, например метод onEnter визуального объекта. Методом проб и ошибок обнаружил что вызывать метод родителя необходимо обязательно, иначе на маке все ломается:

```javascript
onEnter: function() {
	this._super();
}
```

В JS вызывать метод _super() не обязательно  в методах не являющихся конструкторами. Стоит сразу приучить себя вызывать _super там, где подразумевается выполнение родительского метода.


<a name="opacity_anim"</a>
### Анимирование свойства opacity
Чтобы работала анимация свойства <strong>opacity</strong>  с помощью  <strong>fadeOut/fadeIn</strong> на декстопе необходимо у визуального объекта вызвать метод:
```javascript
sprite.setCascadeOpacityEnabled(true);
```

<a name="result"</a>
## Результат

Итого на текущий момент игра выглядит как показано на видео ниже, и в общей сумме на разработку было потрачено ~36&nbsp;часов:
<iframe width="560" height="315" src="https://www.youtube.com/embed/EMah5RepwVo" frameborder="0" allowfullscreen></iframe>
