export function playNotificationSound() {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    void audio.play().catch((error: unknown) => {
      console.log('No se pudo reproducir el sonido:', error);
    });
  } catch (error) {
    console.log('Error al reproducir sonido:', error);
  }
}
