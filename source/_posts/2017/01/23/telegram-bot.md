---
title: Создаем бота для телеграм на nodejs
tags: 'nodejs, telegram, bots'
category: nodejs
date: 2017-01-23 11:26:11
---


Вы пишите или собираетесь писать игру на JavaScript, и вас мучают вопросы как быть с сервером игры, или как написать бота чтобы опубликовать свою игру в Telegram или другом мессенджере? Спешу обрадовать, на JavaScript вы можете писать серверные приложения, в том числе полноценные сервер с http/сокет соединением и ботов для любых мессенджеров. Может быть в будущем я как нибудь расскажу как написать сокет сервер, в этой же я покажу вам пошагово как создать бота в Telegram, а в следующей как создать свою первую игру и опубликовать в мессенджере Telegram. Статья разделена на несколько частей:

1. [Регистрируем бота в Telegram](/nodejs/telegram-bot/#register)
2. [Установка NodeJS](/nodejs/telegram-bot/#nodejs)
3. [Пишем бота](/nodejs/telegram-bot/#app)
4. [Дополнения](/nodejs/telegram-bot/#advance)
5. [Полный код приложения](/nodejs/telegram-bot/#code)
6. [Что дальше](/nodejs/telegram-bot/#next)

Если вы знакомы с каким либо пунктом, можете сразу приступить к следующему. Погнали...

<!-- more -->

<a name="register"</a>
# Регистрируем бота в Telegram
Для регистрации бота в телеграм существует специальный бот [BotFather](https://t.me/BotFather). Отправьте ему команду **/newbot**, после чего BotFather попросит вас отправить ему имя бота, здесь можно отправить любое имя, которое будет отображаться в списке контактов:
```
Alright, a new bot. How are we going to call it? Please choose a name for your bot.
```
Далее BotFather попросит отправить ему логин вашего бота, логин должен быть уникальным:
```
Good. Now let's choose a username for your bot. It must end in `bot`. Like this, for example: TetrisBot or tetris_bot.
```
Логин должен заканчиваться на **Bot** или **_bot**. После успешного содания бота, BotFather отправим вам token, который необходимо сохранить где нибудь, он нам понадобится для авторизации нашего бота.


<a name="nodejs"</a>
# Установка NodeJS
Для того чтобы писать на языке JavaScript серверные приложения, необходимо установить [NodeJS](https://nodejs.org/). После загрузки и установки откройте командную строку:
1. для windows: нажимаем комбинацию win+R, в появившемся окне вводим **cmd** и нажимаем Enter,
2. в OSX: приложение Терминал находится по адресу `/Applications/Utilities/Terminal.app`, запускаем его.

В командной строке наберите команду `node --version`, а затем `npm --version`, если вы установили NodeJS правильно,  вы должны увидеть что то вроде:
```
node --version
v6.9.4


npm --version
3.10.10
```

Далее зайдите в терминале в каталог, где будет расположен ваш проект. Напомню что для того чтобы пройти в каталог в терминале необходимо набрать команду `cd CatalogName`, чтобы выйти в директорию выше: `cd ../` . Для создания нашего приложения нам понадобятся дополнительные пакеты из **npm-репозитория**:
1. http://npmjs.com/package/node-telegram-bot-api - собственно авторизация и работа с телеграм
2. http://npmjs.com/package/mysql - работа с БД mysql

Для установки пакета необходимо набрать в командной строке `npm install <package name>`. В этом случае пакет будет установлен в каталоге, из которого была вызвана команда `install`, в этом каталоге будет создан каталог с именем `node_modules/`, можно туда не лесть, нам это не понадобится. Вы можете использовать ключ **-g** чтобы модуль установился глобально в систему и был доступен из любого места, но для этого на винде придется еще добавить путь к репозиторию в переменную _PATH_, вы можете сделать это если вам так удобнее. Установим пакеты в текущей рабочей директории:
```bash
npm install node-telegram-bot-api
npm install mysql
```

На этом подготовительные процессы завершены, приступаем к написаню приложения.

<a name="app"</a>
# Пишем бота на nodejs

Создайте в рабочем каталоге каталог `src/`, а в нем файл `app.js` с содержимым:
```JavaScript
console.log("new bot app");
```
Чтобы запустить приложение , наберите в командной строке `node src/app.js` и вы увидет в консоле строку `new bot app`. Ура, вы уже умеете запускать приложение и выводить инфу на экран, можно попрактиковатся и написать свою версию "HelloWorld!"... Идем дальше:
```JavaScript
console.log("my bot app");

var TelegramBot = require('node-telegram-bot-api');

var tg;
function create() {
    var token = "ВАШ TOKEN";
    tg = new TelegramBot(token, {
        polling: true
    });
    tg.on('message', onMessage);
    tg.on('callback_query', onCallbackQuery);
}

function onMessage(message) {
    console.log('message:', message);
}
function onCallbackQuery(callbackQuery) {
    console.log('callbackQuery:', callbackQuery);
}

create();
```
Не забудьте заполнить переменную `var token = "ВАШ TOKEN"` вашим токеном, полученным от бота **BotFather** в первом пункте статьи. Если запустить приложение в командной строке, ваш бот уже сможет получать сообщения, например если в телеграме отправить боту сообщение "ping", вы увидите в консоле запись вида:
```
message: { message_id: 2,
  from: 
   { id: 1234567890,
     first_name: 'Zaur 🆚 🎲',
     username: 'abdulgalimov' },
  chat: 
   { id: 1234567890,
     first_name: 'Zaur 🆚 🎲',
     username: 'abdulgalimov',
     type: 'private' },
  date: 1485111913,
  text: 'ping' }
```
Каке видите мы получили текст сообщения(**text**), информация о пользователе(**from**) и чате(**chat**).  В данном случае инфа о пользователе и чате похожа, это потому что сообщение было отправлено в приватной беседе. Если же боту отправить сообщение из группы, тогда в переменной **chat** будет информация об этой группе. Давайте напишем ответ на сообщение `ping`:
```JavaScript
function onMessage(message) {
    console.log('message:', message);
    if (message.text && message.text.toLowerCase() == 'ping') {
        tg.sendMessage(message.chat.id, 'pong');
        return;
    }
}
```
Чтобы изменения вступили в силу, вам необходимо перезапустить приложение, для этого необходимо в консоле завершить текущее приложение сочетанием клавиш `Ctrl+C` (на винде и на маке), и запустить приложение заново. Не расстраивайтесь, в разделе [Дополнения](/nodejs/telegram-bot/#advance) я покажу как это упростить. После перезапуска приложения, на команду `ping` в любой регистре, бот отправит в ответ `pong`. В методе **tg.sendMessage** третьим параметром вы можете отправить `Object` с параметрами, которые описаны в [Telegram API](https://core.telegram.org/bots/api#sendmessage). Например чтобы отправить текст с html-разметкой:
```JavaScript
var options = {
    parse_mode:'HTML'
};
tg.sendMessage(message.chat.id, '<pre>pong</pre>', options);
```

Давайте попробуем отправить inline-кнопку:
```JavaScript
function onMessage(message) {
    console.log('message:', message);
    if (message.text && message.text.toLowerCase() == 'ping') {
        tg.sendMessage(message.chat.id, '<pre>pong</pre>', {
            parse_mode:'HTML'
        });
        return;
    }
    //
    if (message.text && message.text.toLowerCase() == '/start') {
        sendStartMessage(message);
        return;
    }
}
function sendStartMessage(message) {
    var text = 'Добро пожаловать в нашу супер-пупер игру';
    //
    var helpButton = {
        text:"Об игре",
        callback_data:'helpCmd'
    }
    //
    var gameButton = {
        text:"Начать игру",
        callback_data:'gameCmd'
    }
    //
    var options = {};
    options.reply_markup = {};
    options.reply_markup.inline_keyboard = [];
    options.reply_markup.inline_keyboard.push([helpButton]);
    options.reply_markup.inline_keyboard.push([gameButton]);
    tg.sendMessage(message.chat.id, text, options);
}
```
Здесь для создания кнопок используются параметры **text**-отображемый текст и **callback_data**: эта та информация, которую вы получите когда пользователь нажмет на кнопку, имейте ввиду что этот параметр должен быть строкой, максимальный размер которой не должна превышать 64 байта. Поэтому использовать слова `helpCmd` и `gameCmd` немного не удачное решение, лучше задать какие нибудь константы и отправлять циферки, которые потом можно пропарсить, можно использовать JSON строку, или же просто отправить список параметров разделенных каким нибудь символом, главное уложиться в 64 байта. В этом примере не будем усложнять и сделаем как проще. Еще обратите внимание что `options.reply_markup.inline_keyboard` - это массив массивов, это нужно для того чтобы вы могли размещать кнопки в одной строке или в разных:
Например вот так будут выглядить кнопки если отправить их как в примере выше:
{% asset_img buttons1.png %}
А если отправить кнопки вот так:
```JavaScript
var options = {};
options.reply_markup = {};
options.reply_markup.inline_keyboard = [];
options.reply_markup.inline_keyboard.push([helpButton, gameButton]);
tg.sendMessage(message.chat.id, text, options);
```
Вы получите вот такую картину:
{% asset_img buttons2.png %}

При клике на кнопку вы увидите в консоле:
```
callbackQuery: { id: '558342579097929706',
  from: 
   { id: 1234567890,
     first_name: 'Zaur 🆚 🎲',
     username: 'abdulgalimov' },
  message: 
   { message_id: 32,
     from: 
      { id: 300730554,
        first_name: 'BotName',
        username: 'BotName' },
     chat: 
      { id: 1234567890,
        first_name: 'Zaur 🆚 🎲',
        username: 'abdulgalimov',
        type: 'private' },
     date: 1485114986,
     text: 'Добро пожаловать в нашу супер-пупер игру' },
  chat_instance: '3339727678605318554',
  data: 'helpCmd' }
```
Напишем обработчик этой команды ( допишите метод onCallbackQuery созданный ранее):
```JavaScript
function onCallbackQuery(callbackQuery) {
    console.log('callbackQuery:', callbackQuery);
    if (callbackQuery.data == 'helpCmd') {
        var helpText = "какой то текст об игре";
        tg.sendMessage(callbackQuery.message.chat.id, helpText);
    }
}
```
Теперь при клике на кнопку _Об игре_ мы получим в ответ какой то текст. Но, обратите внимание что на кнопке по прежнему висит индикатор процесса:
{% asset_img callback_indicator.png %}
Чтобы его скрыть, необходимо корректно ответить на callback-сообщение:
```JavaScript
function onCallbackQuery(callbackQuery) {
    console.log('callbackQuery:', callbackQuery);
    if (callbackQuery.data == 'helpCmd') {
        var helpText = "какой то текст об игре";
        tg.sendMessage(callbackQuery.message.chat.id, helpText);
        tg.answerCallbackQuery(callbackQuery.id);
    }
}
```

В метод `answerCallbackQuery` можно передать текст который увидит пользователь во всплывающем окне, подробности в документации [Telegram API](https://core.telegram.org/bots/api#answercallbackquery).


<a name="advance"</a>
# Дополнения
## nodemon
Установите модуль `nodemon` из репозитория `npm`, который будет перезапускать ваше приложение каждый раз когда вы пересохраняете любой файл используемый в приложении. Устанавливать модуль `nodemon` необходимо глобально, используя ключ **-g**:
```bash
npm install nodemon -g
```
После установки, чтобы запустить приложение используйте команду:
```
nodemon src/app.js
```
Теперь каждый раз после изменения файла, ваше приложение будет запускаться с самого начала, удобно на этапе разработки.

## process
Используйте объект [process](https://nodejs.org/api/process.html) чтобы задать имя процессу вашего приложения и получать системные события:
```JavaScript
process.title = "MyTestBot"
process.on('uncaughtException', function(error) {
    log.add('Упс, произошла непредвиденная ошибка: '+error.stack);
    console.error(error.stack);
    return false;
});
```
Свойство **process.title** вы можете использовать для поиска процесса в системе, например на маке или линуксе можно в консоле написать так `ps -A | grep "MyTestBot"`, и вы увидите: `4584 ttys002    0:00.47 MyTestBot`, где 4584 это номер процесса, убить который можно командой `kill 4584`. Как сделать что то подобное на винде, к сожалению не знаю.

## forever
Очень полезный npm-модуль, который возволяет перезапускать вашего бота в случае краха или перезапуска сервера. Команда для установки и список основых команд `forever`:
```
npm install forever -g
forever start src/app.js
forever list
forever stop <process id>
```
Для детального ознакомления читайте документацию [forever](npmjs.com/package/forever).

## Что еще?
Помните, не надо изобретать велосипеда, наверняка все что вам нужно уже есть в npm репозитории. Не поленитесь, и попробуйте поискать прежде чем писать что то свое.


<a name="code"</a>
# Полный код приложения
```JavaScript
console.log("my bot app");

process.title = "MyTestBot"
process.on('uncaughtException', function(error) {
    log.add('Упс, произошла непредвиденная ошибка: '+error.stack);
    console.error(error.stack);
    return false;
});

var TelegramBot = require('node-telegram-bot-api');

var tg;
function create() {
    var token = "ВАШ token";
    tg = new TelegramBot(token, {
        polling: true
    });
    tg.on('message', onMessage);
    tg.on('callback_query', onCallbackQuery);
}

function onMessage(message) {
    console.log('message:', message);
    if (message.text && message.text.toLowerCase() == 'ping') {
        tg.sendMessage(message.chat.id, '<pre>pong</pre>', {
            parse_mode:'HTML'
        });
        return;
    }
    //
    if (message.text && message.text.toLowerCase() == '/start') {
        sendStartMessage(message);
        return;
    }
}
function onCallbackQuery(callbackQuery) {
    console.log('callbackQuery:', callbackQuery);
    if (callbackQuery.data == 'helpCmd') {
        var helpText = "какой то текст об игре";
        tg.sendMessage(callbackQuery.message.chat.id, helpText);
        tg.answerCallbackQuery(callbackQuery.id);
    } else if (callbackQuery.data == 'gameCmd') {
        // стартуем нашу игру
    }
}

// *********************************************

function sendStartMessage(message) {
    var text = 'Добро пожаловать в нашу супер-пупер игру';
    //
    var helpButton = {
        text:"Об игре",
        callback_data:'helpCmd'
    }
    //
    var gameButton = {
        text:"Начать игру",
        callback_data:'gameCmd'
    }
    //
    var options = {};
    options.reply_markup = {};
    options.reply_markup.inline_keyboard = [];
    options.reply_markup.inline_keyboard.push([helpButton]);
    options.reply_markup.inline_keyboard.push([gameButton]);
    tg.sendMessage(message.chat.id, text, options);
}

create();
```

<a name="next"</a>


# Что дальше
В следующей статье я расскажу как запустить игру в Telegram, получить результаты игры, записать их в MySQL базу и как работать с файловой системой для чтения/записи файлов.