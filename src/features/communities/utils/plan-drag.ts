export const planDragType = (kind: 'axis' | 'point') => `application/yebaam-plan-${kind}`;

export function readPlanDrag(transfer: DataTransfer, kind: 'axis' | 'point'): { id: string; version: number } | null {
  try {
    const item = JSON.parse(transfer.getData(planDragType(kind)));
    return typeof item?.id === 'string' && Number.isInteger(item?.version)
      ? { id: item.id, version: item.version } : null;
  } catch { return null; }
}
