export default function EmptyChatState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="text-center">
        <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
          <svg
            className="h-12 w-12 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          Tus mensajes
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xs">
          Envía fotos y mensajes privados a un amigo o grupo
        </p>
      </div>
    </div>
  );
}
