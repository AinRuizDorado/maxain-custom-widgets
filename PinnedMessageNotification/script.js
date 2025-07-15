// Variable de usuario para controlar el volumen
const defaultVolume = 0.5; // Volumen por defecto (50%)











let notificationVolume = defaultVolume;
let notificationTimeout;
let soundPlayed = false;
let notificationSound;
// Escuchar eventos de mensajes pineados
document.addEventListener('widgetEvent', function(event) {
    const eventData = event.detail;
    if (eventData.event_name === 'chatMessagePinnedEvent') {
        showPinNotification(eventData);
    }
});

function showPinNotification(eventData) {
    const container = document.getElementById('pin-notification');
    const usernameElem = document.getElementById('username');
    const messageElem = document.getElementById('message');
    
    clearTimeout(notificationTimeout);
    container.classList.remove('slide-in', 'slide-out');
    
    const username = eventData.data.message.sender.username;
    let message = eventData.data.message.content;
    
    // Procesar emotes en el mensaje
    message = message.replace(/\[emote:(\d+):([^\]]+)\]/g, (match, id, name) => {
        return `<img src="https://files.kick.com/emotes/${id}/fullsize" alt="${name}" class="emote">`;
    });

    const randomColor = getRandomColor();
    
    usernameElem.textContent = `${username}`;
    usernameElem.style.color = randomColor;
    messageElem.innerHTML = message; // Cambiar a innerHTML para renderizar emotes
    
    if (!soundPlayed) {
        playNotificationSound();
        soundPlayed = true;
    }
    
    container.classList.add('slide-in');
    
    notificationTimeout = setTimeout(() => {
        container.classList.remove('slide-in');
        container.classList.add('slide-out');
        soundPlayed = false;
    }, 12000);
}

function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 75%, 65%)`;
}

function playNotificationSound() {
    // Verificar si ya tenemos el elemento de audio
    if (!notificationSound) {
        notificationSound = document.getElementById('notification-sound');
    }
    
    // Aplicar volumen configurado (si está disponible)
    if (typeof userVariables !== 'undefined' && userVariables.notification_volume) {
        notificationVolume = userVariables.notification_volume.value;
    }
    
    // Configurar y reproducir el sonido
    notificationSound.volume = notificationVolume;
    notificationSound.currentTime = 0; // Reiniciar al principio
    notificationSound.play().catch(e => {
        console.error("Error al reproducir sonido:", e);
    });
}

// Configurar variable de usuario para volumen
if (typeof userVariables === 'undefined') {
    // Si no estamos en el entorno de widget, crear un objeto simulado para desarrollo
    var userVariables = {
        notification_volume: { value: defaultVolume }
    };
} else {
    // Crear variable de usuario para volumen si no existe
    if (!userVariables.notification_volume) {
        userVariables.notification_volume = { value: defaultVolume };
    }
}
