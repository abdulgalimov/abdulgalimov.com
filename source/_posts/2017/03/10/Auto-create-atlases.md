---
title: Авто-генерация атласов
date: 2017-03-10 21:02:11
tags:
---

<style type="text/css">
  .tree {
    display:inline-block;
    vertical-align: top;
    border: 1px solid #cecece;
    padding: 4px;
    margin-right: 30px;
  }
  .tree ul {
    margin-top: 0;
  }
  .tree li {
    list-style-type: none;
    padding: 0px;
  }
  .tree br {
    display: none;
  }

  .atlas {
    border: 1px solid #90bade;
    padding: 6px;
    margin-top: 4px;
    margin-bottom: 4px;
  }
  .folder { 
    color: #555555; 
    background-color: #EEEEEE;
    line-height: 30px;
    padding: 4px;
    border-radius: 6px;
    font-size: 18px;
  }
  .file { 
    line-height: 28px;
    padding: 4px;
    border-radius: 6px;
    font-size: 12px;
  }
  .other {
    font-size: 10px;
  }
  .ScoreNums {
    background-color: #d5a6a4;
    border-color: #662320;
  }
  .Tahoma14 {
    background-color: #e8f7ff;
    border-color: #90bade;
  }
  .AtlasUI {
    background-color: #b5f3d2;
    border-color: #3f9166;
  }
  .AtlasAnim {
    background-color: #fbe0b9;
    border-color: #d49740;
  }
  .tree a {
    color: #000000;
  }
</style>

Работая над [карточной игрой](https://www.youtube.com/watch?v=ENRvUeuQDb4) мне часто приходилось создавать разные атласы, объедененные с bitmap-шрифтами. В какой то момент мне надоело каждый раз руками пересобирать атласы, и я решил этот процесс максимально автоматизировать. В итоге родился python-скрипт, который умеет объеденять изображения и шрифты в один атлас, причем делает это по заранее загатовленным настройкам в json-файле, а еще он умеет сжимать изображения с помощю сервиса [tinypng](https://tinypng.com). Итак, давайте сперва разберем с чем имеем дело. Слева исходные файлы, а справа - то что хотим в итоге получить, файлы кликабельные, можно открыть и посмотреть:

<div style="width:100%; display: table">

<div class="tree">
  <span class="folder">./content/</span>
  <ul>
    <li>
      <span class="folder">fonts/</span>
      <ul>
        <div class="atlas ScoreNums">
          <li><a target="_blank" href="{% asset_path content/fonts/ScoreNums.png %}" class="file">ScoreNums.png</a></li>
          <li><a target="_blank" href="{% asset_path content/fonts/ScoreNums.fnt %}" class="file">ScoreNums.fnt</a></li>
        </div>
        <div class="atlas Tahoma14">
          <li><a target="_blank" href="{% asset_path content/fonts/Tahoma14.png %}" class="file">Tahoma14.png</a></li>
          <li><a target="_blank" href="{% asset_path content/fonts/Tahoma14.fnt %}" class="file">Tahoma14.fnt</a></li>
        </div>
      </ul>
    </li>
    <li><span class="folder">textures/</span>
        <ul>
          <li>
            <div class="atlas AtlasUI">
              <span class="folder">ui/</span>
              <ul>
                <li>
                  <span class="folder">buttons/</span>
                    <ul>
                      <li><a target="_blank" href="{% asset_path content/textures/ui/buttons/cry_normal.png %}" class="file">cry_normal.png</a></li>
                      <li><a target="_blank" href="{% asset_path content/textures/ui/buttons/cry_over.png %}" class="file">cry_over.png</a></li>
                    </ul>
                </li>
                <li>
                  <span class="folder">coins/</span>
                  <ul>
                    <li><a target="_blank" href="{% asset_path content/textures/ui/coins/coin1.png %}" class="file">coin1.png</a></li>
                    <li><a target="_blank" href="{% asset_path content/textures/ui/coins/coin2.png %}" class="file">coin2.png</a></li>
                  </ul>
                </li>
                <li>
                  <span class="folder">timer/</span>
                  <ul>
                    <li><a target="_blank" href="{% asset_path content/textures/ui/timer/back.png %}" class="file">back.png</a></li>
                    <li><a target="_blank" href="{% asset_path content/textures/ui/timer/shadow.png %}" class="file">shadow.png</a></li>
                  </ul>
                </li>
                <li><a target="_blank" href="{% asset_path content/textures/ui/temp.jpg %}" class="file jpg">temp.jpg</a></li>
              <ul>
            </div>
          </li>
          <li>
            <div class="atlas AtlasAnim">
              <span class="folder">animation/</span>
              <ul>
                <li><span class="folder">flash/</span></li>
                <ul>
                  <li><a target="_blank" href="{% asset_path content/textures/animation/flash/flash_0001.png %}" class="file">flash_0001.png</a></li>
                  <li><a target="_blank" href="{% asset_path content/textures/animation/flash/flash_0002.png %}" class="file">flash_0002.png</a></li>
                  <li class="other">... other png files ...</li>
                  <li><a target="_blank" href="{% asset_path content/textures/animation/flash/flash_0014.png %}" class="file">flash_0014.png</a></li>
                </ul>
              </ul>
            </div>
          </li>
        </ul>
    </li>
  </ul>
</div>

<div class="tree">
  >>
</div>

<div class="tree">
  <span class="folder">./res/</span>
  <ul>
    <div class="atlas AtlasUI">
      <li>
        <span class="folder">ui/</span>
        <ul>
            <li><a target="_blank" href="{% asset_path res/ui/ui.plist %}" class="file">ui.plist</a></li>
            <li><a target="_blank" href="{% asset_path res/ui/ui.png %}" class="file">ui.png</a></li>
            <li><a target="_blank" href="{% asset_path res/ui/ScoreNums.fnt %}" class="file ScoreNums">ScoreNums.fnt</a></li>
            <li><a target="_blank" href="{% asset_path res/ui/Tahoma14.fnt %}" class="file Tahoma14">Tahoma14.fnt</a></li>
        </ul>
      </li>
    </div>
    <div class="atlas AtlasAnim">
      <li>
        <span class="folder">anim/</span>
        <ul>
            <li><a target="_blank" href="{% asset_path res/anim/FlashAnimation.plist %}" class="file">FlashAnimation.plist</a></li>
            <li><a target="_blank" href="{% asset_path res/anim/FlashAnimation.png %}" class="file">FlashAnimation.png</a></li>
        </ul>
      </li>
    </div>
  </ul>
</div>

</div>

Этот скрипт я использую для сборки атласов для **Cocos2d JS** проекта, но его можно использовать в любом другом, если немного подправить код обработки файла с bitmap-шрифтом.

<!--more-->

В каталоге `content/textures/` имеем два каталога `animations` и `ui`, из которых хотим создать два атласа, при этом в атлас `ui` необходимо добавить два шрифта из каталога `content/fonts/`, _ScoreNums_ и _Tahoma14_. Создаем для того файлик `config.json` в каталоге _content_:
```json
{
  "settings": {
    "workPath": "./",
    "outPath": "../res/",
    "tinyKey": "your api key"
  }
}
```
, в котором:
1. **workPath** - базовый путь для всех исходных файлов
2. **outPath** - базовый путь, куда будут складироваться созданные атласы
3. **tinyKey** - API key сервиса [tinypng](https://tinypng.com), необходимо зарегистрироваться(бесплатно)

Добавим теперь конфиг для создания атласа `animation`:
```json
{
  "settings": {
    "workPath": "./",
    "outPath": "../res/",
    "tinyKey": "your api key"
  },
  "atlases": {
    "flanim": {
      "name": "FlashAnimation",
      "keyPath": "anim/flash/",
      "work": "textures/animation/flash",
      "tpOptions": {
        "--opt": "RGBA5555"
      },
      "tinify": true,
      "out":"anim/"
    }
  }
}
```
, где:
 - **name**: Имя создаваемого файла
 - **keyPath**: Путь который добавляется в начало ключа `<key>` в файле _.plist_, чтобы исключить дублирующиеся имена файлов в разных атласах.
 - **work**: каталог в котором лежат исходные изображения, относительно каталога `settings.workPath`
 - **tpOptions**: объект в который можно записать любые параметры/опции [TexturePacker](https://www.codeandweb.com/texturepacker/documentation#command-line).
 - **tinify**: если задать значение _true_ тогда итоговый атлас будет сжат с помощью сервиса [tinypng](https://tinypng.com)
 - **out**: каталог куда скопировать созданный атлас, итоговый путь получится контактировнием с базовым путём: `settings.outPath + flanim.out`

Чтобы создать атлас, необходимо в командной строке выполнить скрипт:
```bash
python Content.py
```
После выполнения скрипта, в каталоге `./res/` будет создан каталог `anim/` атласом `FlashAnimation.plist` внутри. Если у вас несколько конфигурационных json-файлов, можно вызвать скрипт так:
```bash
python Content.py -c myConf.json
```

Добавим в конфигурацию создание атласа `ui`:
```json
{
  "settings": {
    "workPath": "./",
    "outPath": "../res/",
    "tinyKey": "your api key"
  },
  "atlases": {
    "flanim": {
      "name": "FlashAnimation",
      "keyPath": "anim/flash/",
      "work": "textures/animation/flash",
      "tpOptions": {
        "--opt": "RGBA5555"
      },
      "tinify": true,
      "out":"anim/"
    },
    "ui": {
      "images": {
        "exclude": "timer",
        "templates": ["**/*.png"]
      },
      "work": "textures/ui/",
      "tpOptions": {
        "--opt": "RGBA5555"
      },
      "fonts": [
        {
          "path":"fonts/Tahoma14",
          "name":"Tahoma14"
        },
        {
          "path":"fonts/ScoreNums",
          "name":"ScoreNums"
        }
      ],
      "tinify": true,
      "out":"ui/"
    }
  }
}
```
Обратите внимане, не все параметры обязательные. В объекте `images` можно указать два поля:
 - **exclude**: маска которую необходимо исключить из сборки, можно указать строку или массив строк. В нашем случае исключили каталог `timer`
 - **templates**: шаблон, согласно которому будут включены файлы. По умолчанию `['**/*.png', '**/*.jpg']`, т.е. все найденные png и jpg файлы. Почитать про форматы шаблонов можно в документации к модулю [glob](https://docs.python.org/2/library/glob.html)

Для включения в атлас шрифтов создаем массив `fonts`, в котором объекты содержат два поля:
  - **path**: путь к шрифту(без .fnt и .png), относительно каталога `settings.workPath`
  - **name**: имя выходного файла


 Теперь если запустить скрипт
 ```bash
 python Content.py 
 ```
 Будут созданы два атласа `ui` и `FlashAnim`. Если необходимо создать только один, можно написать так:
 ```bash
 python Content.py -p ui
 # или так:
 python Content.py -p flanim
 # ну или указать несколько атласов через пробел:
 python Content.py -p ui flanim
 ```

**ВНИМАНИЕ** Скрипт написан на языке python версии 3, не забудьте установить его прежде чем запускать.

# Установка модуля tinify
Чтобы иметь возможность из скрита запускать сжатие картинок в сервисе [tinypng](https://tinypng.com), необходимо установить [python модуль tinify](https://tinypng.com/developers/reference/python).


## Установка пакета tinify в OSX

```bash
pip3 install --upgrade tinify
```
У меня при попытке запустить этот скрипт, выдалась ошибка с просьбой обновить pip3, сделать это можно так:
```bash
pip3 install --upgrade pip
```


## Установка пакета tinify в Windows 10
Первым делом качаем скрипт [get-pip.py](https://bootstrap.pypa.io/get-pip.py) и запускаем в консоли:
```bat
python get-pip.py 
```

После чего устанавливаем сам `tinify`:
```bat
python -m pip install -U tinify
```


# Ссылки
 - Собствено сам скрипт <a target="_blank" href="{% asset_path content/Content.py %}">Content.py</a>
 - Архив с примерами <a target="_blank" href="{% asset_path example.zip %}">example.zip</a>