export function getContentText(content: unknown): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'object' && content !== null) {
    const o = content as Record<string, unknown>;
    return String(o.text ?? o._value ?? o.value ?? JSON.stringify(content));
  }
  return '';
}

export function outgoingBubbleRadii(prevSame: boolean, nextSame: boolean): string {
  if (!prevSame && !nextSame) return 'rounded-2xl rounded-br-md';
  if (!prevSame && nextSame) return 'rounded-2xl rounded-br-lg rounded-bl-2xl';
  if (prevSame && nextSame)
    return 'rounded-r-2xl rounded-l-2xl rounded-tr-md rounded-br-md rounded-tl-2xl';
  return 'rounded-2xl rounded-tr-md rounded-tl-2xl rounded-br-md';
}

export function incomingBubbleRadii(prevSame: boolean, nextSame: boolean): string {
  if (!prevSame && !nextSame) return 'rounded-2xl rounded-bl-md';
  if (!prevSame && nextSame) return 'rounded-2xl rounded-bl-lg rounded-br-2xl';
  if (prevSame && nextSame)
    return 'rounded-l-2xl rounded-r-2xl rounded-tl-md rounded-bl-md rounded-tr-2xl';
  return 'rounded-2xl rounded-tl-md rounded-tr-2xl rounded-bl-md';
}

export function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2);
}
