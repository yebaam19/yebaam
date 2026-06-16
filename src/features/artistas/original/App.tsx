import { Route, Routes } from "react-router-dom";
import { PublicLayout } from "./components/layout/PublicLayout";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleGuard } from "./routes/RoleGuard";
import { HomePage } from "./pages/HomePage";
import { ArtistsPage } from "./pages/ArtistsPage";
import { ArtistDetailPage } from "./pages/ArtistDetailPage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { OpportunitiesPage } from "./pages/OpportunitiesPage";
import { OpportunityDetailPage } from "./pages/OpportunityDetailPage";
import { EventsPage } from "./pages/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { CampaignsPage } from "./pages/CampaignsPage";
import { CampaignDetailPage } from "./pages/CampaignDetailPage";
import { ArticlesPage } from "./pages/ArticlesPage";
import { ArticleDetailPage } from "./pages/ArticleDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PanelDashboardPage } from "./pages/PanelDashboardPage";
import { ResourceTablePage } from "./pages/ResourceTablePage";
import { AdminArtistsPage } from "./pages/AdminArtistsPage";
import { AdminReportsPage } from "./pages/AdminReportsPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { ArtistPortfolioManagerPage } from "./pages/ArtistPortfolioManagerPage";
import { ArtistProfileEditorPage } from "./pages/ArtistProfileEditorPage";
import { ArtistRequestsPage } from "./pages/ArtistRequestsPage";
import { ArtistScopedResourcePage } from "./pages/ArtistScopedResourcePage";
import { ArtistServicesManagerPage } from "./pages/ArtistServicesManagerPage";
import { ManagerWorkspacePage } from "./pages/ManagerWorkspacePage";
import { MePage } from "./pages/MePage";

const adminNav = [
  { to: "/admin/dashboard",    label: "Dashboard"      },
  { to: "/admin/users",        label: "Usuarios"       },
  { to: "/admin/artists",      label: "Artistas"       },
  { to: "/admin/portfolio",    label: "Portafolios"    },
  { to: "/admin/opportunities",label: "Oportunidades"  },
  { to: "/admin/events",       label: "Eventos"        },
  { to: "/admin/campaigns",    label: "Campañas"       },
  { to: "/admin/articles",     label: "Artículos"      },
  { to: "/admin/requests",     label: "Solicitudes"    },
  { to: "/admin/reports",      label: "Reportes"       },
  { to: "/admin/activity",     label: "Actividad"      },
  { to: "/admin/settings",     label: "Configuración"  }
];

const artistNav = [
  { to: "/artist/dashboard",   label: "Dashboard"     },
  { to: "/artist/profile",     label: "Perfil"        },
  { to: "/artist/portfolio",   label: "Portafolio"    },
  { to: "/artist/services",    label: "Servicios"     },
  { to: "/artist/experience",  label: "Experiencia"   },
  { to: "/artist/achievements",label: "Logros"        },
  { to: "/artist/education",   label: "Formación"     },
  { to: "/artist/social-links",label: "Redes"         },
  { to: "/artist/requests",    label: "Solicitudes"   },
  { to: "/artist/opportunities",label: "Oportunidades"},
  { to: "/artist/events",      label: "Eventos"       },
  { to: "/artist/campaigns",   label: "Campañas"      },
  { to: "/artist/analytics",   label: "Métricas"      },
  { to: "/artist/settings",    label: "Ajustes"       }
];

const managerNav = [
  { to: "/manager/dashboard",    label: "Dashboard"    },
  { to: "/manager/artists",      label: "Artistas"     },
  { to: "/manager/requests",     label: "Solicitudes"  },
  { to: "/manager/opportunities",label: "Oportunidades"},
  { to: "/manager/events",       label: "Eventos"      },
  { to: "/manager/campaigns",    label: "Campañas"     },
  { to: "/manager/analytics",    label: "Métricas"     }
];

const meNav = [
  { to: "/me",           label: "Resumen"  },
  { to: "/me/follows",   label: "Seguidos" },
  { to: "/me/favorites", label: "Favoritos"},
  { to: "/me/settings",  label: "Ajustes"  }
];

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/artists"                element={<ArtistsPage />} />
        <Route path="/artists/:slug"          element={<ArtistDetailPage />} />
        <Route path="/portfolio"              element={<PortfolioPage />} />
        <Route path="/opportunities"          element={<OpportunitiesPage />} />
        <Route path="/opportunities/:slug"    element={<OpportunityDetailPage />} />
        <Route path="/events"                 element={<EventsPage />} />
        <Route path="/events/:slug"           element={<EventDetailPage />} />
        <Route path="/campaigns"              element={<CampaignsPage />} />
        <Route path="/campaigns/:slug"        element={<CampaignDetailPage />} />
        <Route path="/articles"               element={<ArticlesPage />} />
        <Route path="/articles/:slug"         element={<ArticleDetailPage />} />
        <Route path="/login"                  element={<LoginPage />} />
        <Route path="/register"               element={<RegisterPage />} />
        <Route path="/unauthorized"           element={<UnauthorizedPage />} />
        <Route path="/not-found"              element={<NotFoundPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleGuard roles={["PLATFORM_ADMIN"]} />}>
          <Route path="/admin" element={<DashboardLayout title="Administración" items={adminNav} />}>
            <Route index          element={<PanelDashboardPage title="Dashboard de plataforma" description="Métricas globales de usuarios, artistas, contenido, solicitudes e interacciones." endpoint="/admin/dashboard" />} />
            <Route path="dashboard" element={<PanelDashboardPage title="Dashboard de plataforma" description="Métricas globales de PerfilArtístico." endpoint="/admin/dashboard" />} />
            <Route path="users"        element={<AdminUsersPage />} />
            <Route path="artists"      element={<AdminArtistsPage />} />
            <Route path="portfolio"    element={<ResourceTablePage title="Portafolios"    description="Revisión de piezas publicadas."                       endpoint="/portfolio" />} />
            <Route path="opportunities"element={<ResourceTablePage title="Oportunidades"  description="Gestión de oportunidades globales."                  endpoint="/admin/opportunities" />} />
            <Route path="events"       element={<ResourceTablePage title="Eventos"        description="Gestión de eventos."                                  endpoint="/admin/events" />} />
            <Route path="campaigns"    element={<ResourceTablePage title="Campañas"       description="Gestión de campañas."                                 endpoint="/admin/campaigns" />} />
            <Route path="articles"     element={<ResourceTablePage title="Artículos"      description="Gestión editorial."                                   endpoint="/admin/articles" />} />
            <Route path="requests"     element={<ResourceTablePage title="Solicitudes"    description="Solicitudes globales de contacto, booking y colaboración." endpoint="/admin/requests" />} />
            <Route path="reports"      element={<AdminReportsPage />} />
            <Route path="activity"     element={<ResourceTablePage title="Actividad"      description="Logs recientes de plataforma."                       endpoint="/admin/activity" />} />
            <Route path="settings"     element={<ResourceTablePage title="Configuración"  description="Configuración general."                              endpoint="/admin/settings" />} />
          </Route>
        </Route>

        <Route element={<RoleGuard roles={["ARTIST"]} />}>
          <Route path="/artist" element={<DashboardLayout title="Panel de artista" items={artistNav} />}>
            <Route index          element={<PanelDashboardPage title="Dashboard de artista" description="Métricas y actividad de tu perfil artístico." endpoint="/artist/dashboard" />} />
            <Route path="dashboard" element={<PanelDashboardPage title="Dashboard de artista" description="Métricas y actividad de tu perfil artístico." endpoint="/artist/dashboard" />} />
            <Route path="profile"      element={<ArtistProfileEditorPage />} />
            <Route path="portfolio"    element={<ArtistPortfolioManagerPage />} />
            <Route path="services"     element={<ArtistServicesManagerPage />} />
            <Route path="experience"   element={<ArtistScopedResourcePage title="Experiencia" description="Trayectoria profesional registrada en tu perfil." resource="experience" />} />
            <Route path="achievements" element={<ArtistScopedResourcePage title="Logros" description="Reconocimientos y resultados relevantes de tu carrera." resource="achievements" />} />
            <Route path="education"    element={<ArtistScopedResourcePage title="Formación" description="Formación artística y profesional asociada a tu perfil." resource="education" />} />
            <Route path="social-links" element={<ArtistScopedResourcePage title="Redes sociales" description="Canales públicos conectados a tu marca artística." resource="social-links" />} />
            <Route path="requests"     element={<ArtistRequestsPage />} />
            <Route path="opportunities"element={<ResourceTablePage title="Oportunidades" description="Oportunidades abiertas para artistas." endpoint="/opportunities" />} />
            <Route path="events"       element={<ResourceTablePage title="Eventos" description="Eventos publicados en la plataforma." endpoint="/events" />} />
            <Route path="campaigns"    element={<ResourceTablePage title="Campañas" description="Campañas activas en la plataforma." endpoint="/campaigns" />} />
            <Route path="analytics"    element={<PanelDashboardPage title="Métricas de artista" description="Lectura analítica de tu perfil artístico." endpoint="/artist/dashboard" />} />
            <Route path="settings"     element={<MePage />} />
          </Route>
        </Route>

        <Route element={<RoleGuard roles={["MANAGER"]} />}>
          <Route path="/manager" element={<DashboardLayout title="Panel de manager" items={managerNav} />}>
            <Route index          element={<PanelDashboardPage title="Dashboard de manager" description="Métricas agregadas de artistas asignados." endpoint="/manager/dashboard" />} />
            <Route path="dashboard"    element={<PanelDashboardPage title="Dashboard de manager" description="Métricas agregadas de artistas asignados." endpoint="/manager/dashboard" />} />
            <Route path="artists"      element={<ManagerWorkspacePage section="artists" />} />
            <Route path="requests"     element={<ManagerWorkspacePage section="requests" />} />
            <Route path="opportunities"element={<ResourceTablePage title="Oportunidades"        description="Oportunidades disponibles para aplicar."            endpoint="/opportunities" />} />
            <Route path="events"       element={<ManagerWorkspacePage section="events" />} />
            <Route path="campaigns"    element={<ManagerWorkspacePage section="campaigns" />} />
            <Route path="analytics"    element={<PanelDashboardPage title="Métricas de manager" description="Lectura agregada de tus artistas."                  endpoint="/manager/dashboard" />} />
          </Route>
        </Route>

        <Route element={<RoleGuard roles={["FOLLOWER"]} />}>
          <Route path="/me" element={<DashboardLayout title="Mi cuenta" items={meNav} />}>
            <Route index           element={<MePage />} />
            <Route path="follows"  element={<ResourceTablePage title="Artistas seguidos" description="Perfiles que sigues."   endpoint="/me/follows" />} />
            <Route path="favorites"element={<ResourceTablePage title="Favoritos"          description="Perfiles guardados."    endpoint="/me/favorites" />} />
            <Route path="settings" element={<MePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
