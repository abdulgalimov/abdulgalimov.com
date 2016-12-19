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

