import { Badge } from "./Badge";

const roleMap: Record<string, { label: string; variant: "green" | "orange" | "gold" | "dark" | "default" }> = {
  PLATFORM_ADMIN: { label: "Admin",   variant: "dark" },
  MANAGER:        { label: "Manager", variant: "orange" },
  ARTIST:         { label: "Artista", variant: "green" },
  FOLLOWER:       { label: "Seguidor",variant: "default" }
};

export function RoleBadge({ role }: { role: string }) {
  const cfg = roleMap[role] ?? { label: role, variant: "default" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
