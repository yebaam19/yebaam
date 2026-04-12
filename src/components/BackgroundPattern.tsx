/**
 * BackgroundPattern Component
 * 
 * Patrón de grid decorativo para fondos de secciones hero.
 * Reutilizable en diferentes componentes con gradientes.
 */

interface BackgroundPatternProps {
    /**
     * Opacidad del patrón (0-1)
     * @default 0.1
     */
    opacity?: number;
    /**
     * Color del patrón
     * @default "white"
     */
    color?: string;
}

export function BackgroundPattern({ opacity = 0.1, color = 'white' }: BackgroundPatternProps) {
    return (
        <div className="absolute inset-0 pointer-events-none" style={{ opacity }}>
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                    <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke={color} strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid-pattern)" />
            </svg>
        </div>
    );
}
