
// =============================================
// CONFIGURACIÓN FÁCIL PARA USUARIOS NO TÉCNICOS
// =============================================


// para desactivar el videoshare reemplazar el false por true
// si esta en true es porq ya esta desactivado, para volver a activar hay que poner false
// Ejemplos:
// const DESACTIVAR_VIDEOSHARE = true;  // videoshare desactivado
// const DESACTIVAR_VIDEOSHARE = false; // videoshare activado
const DESACTIVAR_VIDEOSHARE = false;

// Duración de reproducción de videos (en segundos)
const DEFAULT_VIDEO_DURATION = 15;

// Tiempo de espera entre videos (en segundos)
const DEFAULT_POST_COOLDOWN = 10;
































































// =============================================
// FILTRO DE CONTENIDO +18 (NUEVA SECCIÓN)
// =============================================
const NSFW_FILTER = {
	// Palabras clave en múltiples idiomas
	forbiddenKeywords: [
		'porn', 'xxx', 'nsfw', 'sex', 'nude', 'naked', 'fuck', 'suck', 'cock', 'dick', 'pussy',
		'vagina', 'penis', 'cum', 'orgasm', 'blowjob', 'handjob', 'tits', 'boobs', 'anal',
		'hentai', 'ejaculation', 'bdsm', 'fetish', 'rape', 'gore', 'blood', 'violence',
		'murder', 'death', 'suicide', 'decapitation', 'mutilation', 'snuff', 'torture',
		'desnudo', 'desnuda', 'sexo', 'porno', 'follar', 'mamar', 'polla', 'pene', 'vagina',
		'tetas', 'culos', 'nalgas', 'corrida', 'eyaculación', 'violación', 'gore', 'sangre',
		'violencia', 'asesinato', 'muerte', 'suicidio', 'decapitación', 'mutilación'
	],

	// Expresiones regulares para patrones específicos
	patterns: [
		/(18\+|adult|explicit)/i,
		/(nud(e|ity)|desnud(o|a|os|as))/i,
		/(bare\s?skin|skin\s?exposure)/i,
		/(sexual|sexo|sexy|erotic)/i,
		/(breast|boob|tits?|tetas?|pechos?)/i,
		/(nipple|pez[óo]n)/i,
		/(genital|genitales)/i,
		/(explicit|expl[ií]cito)/i,
		/(gore|blood|sangre|violence|violencia)/i
	],

	// Verifica si el contenido es seguro
	isSafe: function (title, description) {
		const text = `${title} ${description}`.toLowerCase();

		// Verificar palabras clave prohibidas
		if (this.forbiddenKeywords.some(keyword =>
			text.includes(keyword) ||
			new RegExp(`\\b${keyword}\\b`).test(text))) {
			return false;
		}

		// Verificar patrones complejos
		if (this.patterns.some(regex => regex.test(text))) {
			return false;
		}

		// Verificar combinaciones sospechosas
		if ((text.includes('breast') && text.includes('feeding')) ||
			(text.includes('desnudo') && text.includes('artístico'))) {
			return false;
		}

		return true;
	}
};

// =============================================
// NO MODIFICAR EL CÓDIGO A PARTIR DE ESTE PUNTO
// =============================================

document.addEventListener('widgetEvent', handleWidgetEvent);

// Expresión regular mejorada para detectar YouTube, Twitch y Kick
const VIDEO_REGEX = /!videoshare\s+(?:https?:\/\/)?(?:www\.)?(?:(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})|youtube\.com\/watch\?.*\bv=([\w-]{11})|youtube\.com\/shorts\/([\w-]{11})|(?:twitch\.tv\/\w+\/clip\/|clips\.twitch\.tv\/)([\w-]+)|(?:kick\.com\/[^\/]+\/clips\/|clips\.kick\.com\/)(clip_[\w]+))(?:.*?[?&]t=(\d+))?/i;

let currentTimer = null;
let countdownInterval = null;
let isPlaying = false;
let isInCooldown = false;

function handleWidgetEvent(event) {
	const eventName = event.detail.event_name;

	if (eventName === 'chatMessageEvent') {
		if (isInCooldown) return;

		const message = event.detail.data.content;

		if (message.toLowerCase().includes('!videoshare')) {
			const videoInfo = extractVideoInfo(message);

			if (videoInfo && !isPlaying) {
				const username = event.detail.data.sender.username;
				if (!DESACTIVAR_VIDEOSHARE) {
					playVideo(videoInfo, username);
				}
			}
		}
	}

	// Resetear color después de eventos relevantes
	if (eventName === 'streamOffline' || eventName === 'chatClearedEvent') {
		document.getElementById('user-info').style.background = 'rgba(0, 0, 0, 0.7)';
	}
}

// Función para convertir duración ISO 8601 a segundos
function parseISODuration(duration) {
	let totalSeconds = 0;
	const hoursMatch = duration.match(/(\d+)H/);
	const minutesMatch = duration.match(/(\d+)M/);
	const secondsMatch = duration.match(/(\d+)S/);

	if (hoursMatch) totalSeconds += parseInt(hoursMatch[1]) * 3600;
	if (minutesMatch) totalSeconds += parseInt(minutesMatch[1]) * 60;
	if (secondsMatch) totalSeconds += parseInt(secondsMatch[1]);

	return totalSeconds;
}

// Extrae información de video (YouTube, Twitch y Kick)
function extractVideoInfo(message) {
	const match = message.match(VIDEO_REGEX);

	if (!match) return null;

	// Detectar YouTube
	if (match[1] || match[2] || match[3]) {
		let videoId;
		let isShort = false;

		if (match[3]) {
			videoId = match[3];
			isShort = true;
		} else {
			videoId = match[1] || match[2];
		}

		const startTime = match[6] ? parseInt(match[6]) : 0;

		return {
			videoType: 'youtube',
			videoId,
			startTime,
			isShort
		};
	}
	// Detectar Twitch
	else if (match[4]) {
		return {
			videoType: 'twitch',
			videoId: match[4]
		};
	}
	// Detectar Kick
	else if (match[5]) {
		return {
			videoType: 'kick',
			videoId: match[5],
		};
	}

	return null;
}

// =============================================
// FUNCIÓN PARA MOSTRAR MENSAJE DE BLOQUEO (NUEVO)
// =============================================
function showBlockedMessage(username) {
	const player = document.getElementById('yt-player');
	const placeholder = document.getElementById('placeholder');
	const userInfo = document.getElementById('user-info');
	const usernameSpan = document.getElementById('username');

	// Configurar elementos
	player.style.display = 'none';
	placeholder.style.display = 'flex';
	placeholder.style.opacity = '1';
	placeholder.innerHTML = '<div class="blocked-message">🚫 Contenido bloqueado</div>';
	placeholder.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';

	usernameSpan.textContent = username;
	userInfo.style.display = 'flex';
	userInfo.style.background = 'rgba(200, 0, 0, 0.7)';

	// Restaurar después de 5 segundos
	setTimeout(() => {
		placeholder.innerHTML = '';
		placeholder.style.backgroundColor = '';
		userInfo.style.display = 'none';
	}, 5000);
}

// Reproduce video (YouTube, Twitch o Kick)
async function playVideo(videoInfo, username = '') {
	const player = document.getElementById('yt-player');
	const placeholder = document.getElementById('placeholder');
	const countdown = document.getElementById('countdown');
	const userInfo = document.getElementById('user-info');
	const usernameSpan = document.getElementById('username');

	stopCurrentVideo();

	// Kick sin cookies (actualmente no es posible poner únicamente el video)
	const container = document.getElementById('player-container');
	if (videoInfo.videoType === 'kick') {
		container.classList.add('kick');
	} else {
		container.classList.remove('kick');
	}

	// Crea el logo
	let logoImg = document.getElementById('platform-logo');
	if (!logoImg) {
		logoImg = document.createElement('img');
		logoImg.id = 'platform-logo';
		userInfo.prepend(logoImg);
	}
	logoImg.style.display = 'inline-block';

	// Obtener API key de variables de usuario
	const apiKey = 'youtubeAPI';
	// Obtener duración del video desde variables de usuario o usar valor por defecto
	let videoDuration = userVariables.video_duration?.value
		? parseInt(userVariables.video_duration.value)
		: DEFAULT_VIDEO_DURATION;

	// Cambiar color y logo según plataforma
	if (videoInfo.videoType === 'twitch') {
		userInfo.style.background = 'rgba(0, 0, 0, 0.7)';
		logoImg.src = 'https://assets.twitch.tv/assets/favicon-32-e29e246c157142c94346.png';
	} else if (videoInfo.videoType === 'youtube') {
		userInfo.style.background = 'rgba(0, 0, 0, 0.7)';
		logoImg.src = "https://www.youtube.com/s/desktop/77bb79f2/img/logos/favicon_32x32.png";
	} else if (videoInfo.videoType === 'kick') {
		userInfo.style.background = 'rgba(0, 0, 0, 0.7)';
		logoImg.src = 'https://kick.com/favicon.ico';
	}

	// Si tenemos API key y es YouTube, obtener duración real y verificar contenido
	if (apiKey && videoInfo.videoType === 'youtube') {
		try {
			const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoInfo.videoId}&part=snippet,contentDetails&key=${apiKey}`);
			const data = await response.json();

			if (data.items && data.items.length > 0) {
				const videoDetails = data.items[0];

				// =============================================
				// APLICAR FILTRO NSFW (NUEVA VERIFICACIÓN)
				// =============================================
				if (!NSFW_FILTER.isSafe(videoDetails.snippet.title, videoDetails.snippet.description)) {
					console.log('Video bloqueado por contenido inapropiado');
					showBlockedMessage(username);
					return;
				}

				// Procesar duración del video
				const isoDuration = videoDetails.contentDetails.duration;
				const realDuration = parseISODuration(isoDuration);

				// Ajustar duración
				videoDuration = Math.min(videoDuration, realDuration - (videoInfo.startTime || 0));
				if (videoDuration < 1) videoDuration = 1;
			}
		} catch (error) {
			console.error('Error obteniendo detalles del video:', error);
		}
	}

	// Construir URL según plataforma
	let videoUrl;
	if (videoInfo.videoType === 'youtube') {
		if (videoInfo.isShort) {
			videoUrl = `https://www.youtube.com/embed/${videoInfo.videoId}?autoplay=1&mute=0`;
		} else {
			videoUrl = `https://www.youtube.com/embed/${videoInfo.videoId}?autoplay=1&mute=0&start=${videoInfo.startTime}`;
		}
	} else if (videoInfo.videoType === 'twitch') {
		videoUrl = `https://clips.twitch.tv/embed?clip=${videoInfo.videoId}&parent=widgets.kickbot.com&autoplay=true&muted=false`;
	} else if (videoInfo.videoType === 'kick') {
		videoUrl = `https://kick.com/embed/clips/${videoInfo.videoId}?autoplay=true&muted=false`;
	}

	player.src = videoUrl;
	player.style.display = 'block';
	countdown.style.display = 'flex';
	placeholder.style.opacity = '0';

	usernameSpan.textContent = username;
	userInfo.style.display = 'flex';

	setTimeout(() => {
		placeholder.style.display = 'none';
	}, 300);

	isPlaying = true;

	let secondsLeft = videoDuration;
	countdown.textContent = secondsLeft;

	countdownInterval = setInterval(() => {
		secondsLeft--;
		countdown.textContent = secondsLeft;

		if (secondsLeft <= 0) {
			stopCurrentVideo();
		}
	}, 1000);

	currentTimer = setTimeout(() => {
		stopCurrentVideo();

		// Aplicar post cooldown si está configurado
		const postCooldown = DEFAULT_POST_COOLDOWN;

		if (postCooldown > 0) {
			isInCooldown = true;
			setTimeout(() => {
				isInCooldown = false;
			}, postCooldown * 1000);
		}
	}, videoDuration * 1000);
}

// Detiene el video actual
function stopCurrentVideo() {
	if (!isPlaying) return;

	const player = document.getElementById('yt-player');
	const placeholder = document.getElementById('placeholder');
	const countdown = document.getElementById('countdown');
	const userInfo = document.getElementById('user-info');

	clearTimeout(currentTimer);
	clearInterval(countdownInterval);

	player.src = '';
	player.style.display = 'none';
	countdown.style.display = 'none';
	userInfo.style.display = 'none';
	placeholder.style.display = 'flex';

	setTimeout(() => {
		placeholder.style.opacity = '1';
	}, 10);

	isPlaying = false;
}
