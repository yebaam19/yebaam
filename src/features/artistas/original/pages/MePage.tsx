import { Heart, Settings, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";

export function MePage() {
  const { user } = useAuth();
  return (
    <div className="animate-fade-in">
      <PageHeader title="Mi cuenta" description="Gestiona tu experiencia como seguidor dentro de PerfilArtístico." />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mintLight">
            <UserRound className="text-brand-green" size={20} />
          </div>
          <h2 className="mt-3 font-black text-brand-ink">{user?.displayName}</h2>
          <p className="text-sm text-brand-muted">{user?.email}</p>
        </Card>
        <Link to="/me/follows">
          <Card hover className="p-5 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
              <Heart className="text-red-500" size={20} />
            </div>
            <h2 className="mt-3 font-black text-brand-ink">Artistas seguidos</h2>
            <p className="text-sm text-brand-muted">Perfiles que sigues.</p>
          </Card>
        </Link>
        <Link to="/me/settings">
          <Card hover className="p-5 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <Settings className="text-brand-gold" size={20} />
            </div>
            <h2 className="mt-3 font-black text-brand-ink">Configuración</h2>
            <p className="text-sm text-brand-muted">Preferencias de cuenta.</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
