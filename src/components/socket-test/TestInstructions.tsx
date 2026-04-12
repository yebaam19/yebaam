export function TestInstructions() {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-lg p-6">
      <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">
         Instrucciones de Prueba
      </h2>
      <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
        <div className="flex gap-3">
          <span className="font-bold">1.</span>
          <p>
            Abre esta página en <strong>3 navegadores diferentes</strong> (Chrome, Firefox, Safari) o
            en <strong>3 ventanas de incógnito</strong>
          </p>
        </div>
        <div className="flex gap-3">
          <span className="font-bold">2.</span>
          <p>
            Inicia sesión con <strong>usuarios diferentes</strong> en cada navegador
          </p>
        </div>
        <div className="flex gap-3">
          <span className="font-bold">3.</span>
          <p>
            Verifica que el contador de <strong>"Usuarios Conectados"</strong> muestre{' '}
            <strong>3</strong> en todas las ventanas
          </p>
        </div>
        <div className="flex gap-3">
          <span className="font-bold">4.</span>
          <p>
            Haz clic en cualquier botón de evento y verifica que <strong>TODAS las ventanas</strong>{' '}
            reciban el evento
          </p>
        </div>
        <div className="flex gap-3">
          <span className="font-bold">5.</span>
          <p>
            Prueba crear un post real en una ventana y verifica que aparezca automáticamente en las
            otras
          </p>
        </div>
        <div className="flex gap-3">
          <span className="font-bold">6.</span>
          <p>Usa los filtros de categoría para ver solo los eventos que te interesan</p>
        </div>
        <div className="flex gap-3">
          <span className="font-bold">7.</span>
          <p>
            Observa el stream de eventos en tiempo real y verifica que los colores y emojis ayuden a
            identificar cada tipo
          </p>
        </div>
      </div>
    </div>
  );
}
