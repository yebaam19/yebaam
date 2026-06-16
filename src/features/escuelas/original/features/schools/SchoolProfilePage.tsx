import { FormEvent, useEffect, useMemo, useState, type ReactNode, type SyntheticEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import type { EnrollmentLeadPayload, Instructor, Program, Review, School } from '../../types';

const MODALITY_LABELS: Record<string, string> = {
  PRESENTIAL: 'Presencial',
  VIRTUAL: 'Virtual',
  HYBRID: 'Híbrido',
};

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Inicial',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
  PROFESSIONAL: 'Profesional',
};

interface LeadForm {
  name: string;
  email: string;
  phone: string;
  message: string;
  programId: string;
  preferredContactMethod: 'email' | 'phone' | 'whatsapp';
}

const EMPTY_FORM: LeadForm = {
  name: '',
  email: '',
  phone: '',
  message: '',
  programId: '',
  preferredContactMethod: 'whatsapp',
};

function StarRating({ rating, interactive = false, onChange }: {
  rating: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={`text-lg leading-none ${star <= rating ? 'text-amber-400' : 'text-slate-200'} ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          aria-label={`Calificar ${star}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  if (days < 365) return `hace ${Math.floor(days / 30)} meses`;
  return `hace ${Math.floor(days / 365)} años`;
}

function formatPrice(program: Program) {
  return `${program.monthlyPrice.toLocaleString('es-ES')} ${program.currency}`;
}

function getAverageRating(reviews: Review[]) {
  if (!reviews.length) return null;
  return Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10;
}

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null;
  event.currentTarget.style.display = 'none';
}

function getParagraphs(text?: string) {
  return (text ?? '')
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function sectionTitle(title: string, subtitle?: string, action?: string) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-black text-[#151d18]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-[#667267]">{subtitle}</p>}
      </div>
      {action && (
        <span className="hidden text-sm font-bold text-[#007a3d] sm:inline-flex">
          {action} <span className="material-symbols-outlined ml-1 text-base">arrow_forward</span>
        </span>
      )}
    </div>
  );
}

function ImagePlaceholder({ icon, label, className = '' }: { icon: string; label?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-[#e8f5ec] text-center text-[#007a3d] ${className}`}>
      <div>
        <span className="material-symbols-outlined text-4xl">{icon}</span>
        {label && <p className="mt-2 px-4 text-xs font-black uppercase tracking-wide">{label}</p>}
      </div>
    </div>
  );
}

function socialHref(label: string, value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  const handle = value.trim().replace(/^@/, '');
  const bases: Record<string, string> = {
    Instagram: 'https://www.instagram.com/',
    Facebook: 'https://www.facebook.com/',
    TikTok: 'https://www.tiktok.com/@',
    YouTube: 'https://www.youtube.com/@',
  };
  return `${bases[label] ?? 'https://'}${handle}`;
}

function SchoolImage({
  src,
  alt,
  className,
  placeholder,
}: {
  src?: string | null;
  alt: string;
  className: string;
  placeholder: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return <>{placeholder}</>;
  return <img src={src} alt={alt} onError={() => setFailed(true)} className={className} />;
}

export default function SchoolProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const { isAuthenticated, user } = useAuth();

  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<LeadForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ ok: boolean; data: School }>(`/schools/${id}`)
      .then((response) => setSchool(response.data.data))
      .catch((err: { message?: string }) => setError(err.message ?? 'No fue posible cargar la escuela'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleLeadSubmit(event: FormEvent) {
    event.preventDefault();
    if (!school) return;

    setSubmitting(true);
    const payload: EnrollmentLeadPayload = {
      schoolId: school.id,
      name: form.name,
      email: form.email,
      phone: form.phone,
      message: form.message || undefined,
      preferredContactMethod: form.preferredContactMethod,
      programId: form.programId || undefined,
    };

    try {
      await api.post('/leads', payload);
      setLeadSent(true);
      setForm(EMPTY_FORM);
      showToast('Tu solicitud fue enviada. La escuela te contactará pronto.', 'success');
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo enviar la solicitud.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReviewSubmit(event: FormEvent) {
    event.preventDefault();
    if (!school || reviewRating === 0) return;

    setReviewSubmitting(true);
    try {
      await api.post('/reviews', { schoolId: school.id, rating: reviewRating, title: 'Reseña de estudiante', body: reviewComment });
      setReviewSent(true);
      showToast('Reseña enviada.', 'success');
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo enviar la reseña.', 'error');
    } finally {
      setReviewSubmitting(false);
    }
  }

  const computed = useMemo(() => {
    const programs = school?.programs ?? [];
    const instructors = school?.instructors ?? [];
    const reviews = school?.reviews ?? [];
    const mediaAssets = school?.mediaAssets ?? [];
    const imageAssets = mediaAssets.filter((asset) => !['VIDEO_URL', 'VIDEO', 'REEL'].includes(asset.type));
    const videoAssets = mediaAssets.filter((asset) => ['VIDEO_URL', 'VIDEO', 'REEL'].includes(asset.type));
    const publishedArticles = school?.articles ?? [];
    const articleParagraphs = getParagraphs(school?.aboutArticle);
    const articleImage =
      imageAssets.find((asset) => asset.isPrimary)?.url ??
      imageAssets[0]?.url ??
      school?.coverImageUrl ??
      school?.profileImageUrl ??
      null;
    const modalitySet = new Set(programs.map((program) => program.modality));
    const modalitySummary = modalitySet.size
      ? Array.from(modalitySet).map((modality) => MODALITY_LABELS[modality] ?? modality).join(' · ')
      : 'Modalidad por confirmar';

    return {
      programs,
      instructors,
      reviews,
      gallery: imageAssets,
      videoAssets,
      modalitySummary,
      avgRating: getAverageRating(reviews),
      featuredPrograms: programs.slice(0, 3),
      secondaryPrograms: programs.slice(3, 6),
      featuredInstructors: instructors.slice(0, 6),
      publishedArticles,
      articleParagraphs,
      articleImage,
    };
  }, [school]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <SkeletonCard />
          <div className="grid gap-5 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </section>
    );
  }

  if (error) return <EmptyState title="Error" description={error} />;
  if (!school) return <EmptyState title="Escuela no encontrada" description="Revisa el enlace o regresa al listado." />;

  const canReview = isAuthenticated && user?.role === 'STUDENT_OR_PARENT' && !reviewSent;
  const tabs = [
    ['inicio', 'Inicio'],
    ['cursos', 'Cursos'],
    ['docentes', 'Docentes'],
    ['reels', 'Reels'],
    ['fotos', 'Fotos'],
    ['articulos', 'Artículos'],
    ['resenas', 'Reseñas'],
    ['contacto', 'Contacto'],
  ];
  const socialLinks = [
    { label: 'Instagram', url: school.instagram },
    { label: 'Facebook', url: school.facebook },
    { label: 'TikTok', url: school.tiktok },
    { label: 'YouTube', url: school.youtube },
  ].filter((link): link is { label: string; url: string } => Boolean(link.url));

  return (
    <main className="bg-[#f3fcf3] text-[#151d18]">
      <section id="inicio" className="mx-auto max-w-7xl px-5 pb-8 sm:px-6 lg:px-8">
        <div className="h-48 overflow-hidden rounded-b-lg bg-[#e6eee6] sm:h-64 lg:h-72">
          <SchoolImage
            src={school.coverImageUrl}
            alt={`Portada de ${school.name}`}
            className="h-full w-full object-cover"
            placeholder={<ImagePlaceholder icon="image" label="Portada pendiente" className="h-full w-full" />}
          />
        </div>

        <div className="relative mx-auto -mt-14 max-w-6xl rounded-lg border border-[#dfeadf] bg-white/95 p-5 shadow-[0_20px_60px_rgba(29,65,35,0.12)] backdrop-blur sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
            <div className="flex gap-4">
              <div className="relative shrink-0">
                <SchoolImage
                  src={school.profileImageUrl}
                  alt={school.name}
                  className="h-16 w-16 rounded-full border-4 border-[#eef8ef] object-cover sm:h-20 sm:w-20"
                  placeholder={
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#eef8ef] bg-[#e8f5ec] text-xl font-black text-[#007a3d] sm:h-20 sm:w-20">
                      {school.name.charAt(0)}
                    </div>
                  }
                />
                {school.isVerified && (
                  <span className="absolute -right-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#007a3d] text-white">
                    <span className="material-symbols-outlined text-sm">check</span>
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-normal text-[#111811] sm:text-5xl">{school.name}</h1>
                  {school.isVerified && <span className="material-symbols-outlined text-[#007a3d]">verified</span>}
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f6d61]">{school.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-[#59665b]">
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">location_on</span>
                    {school.city}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">computer</span>
                    {computed.modalitySummary}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">school</span>
                    {computed.programs.length} cursos
                  </span>
                  {computed.avgRating !== null && (
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-base text-[#f5a524]">star</span>
                      {computed.avgRating} ({computed.reviews.length} reseñas)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <a href="#contacto" className="inline-flex h-10 items-center justify-center rounded-md bg-[#007a3d] px-5 text-sm font-bold text-white transition hover:bg-[#006432]">
                {school.primaryCtaLabel}
              </a>
              <button className="inline-flex h-10 items-center justify-center rounded-md border border-[#cddccd] bg-white px-5 text-sm font-bold text-[#26362b] transition hover:border-[#007a3d] hover:text-[#007a3d]">
                {school.secondaryCtaLabel}
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-md border border-[#dce8dc] bg-white text-[#26362b]">
                <span className="material-symbols-outlined text-[20px]">bookmark</span>
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-md border border-[#dce8dc] bg-white text-[#26362b]">
                <span className="material-symbols-outlined text-[20px]">share</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <nav className="sticky top-[73px] z-30 border-y border-[#dce8dc] bg-[#f3fcf3]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 hide-scrollbar sm:px-6 lg:px-8">
          {tabs.map(([href, label], index) => (
            <a
              key={href}
              href={`#${href}`}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
                index === 0
                  ? 'bg-[#007a3d] text-white'
                  : 'text-[#35443a] hover:bg-white hover:text-[#007a3d]'
              }`}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['verified', school.isVerified ? 'Escuela verificada' : 'Perfil activo'],
            ['auto_stories', `${computed.programs.length} cursos`],
            ['groups', school.capacity ? `${school.capacity} cupos` : 'Capacidad por confirmar'],
            ['workspace_premium', `${computed.instructors.length || 1} docentes`],
          ].map(([icon, label]) => (
            <div key={label} className="rounded-lg border border-[#e2ece2] bg-white p-5 text-center shadow-[0_12px_35px_rgba(29,65,35,0.06)]">
              <span className="material-symbols-outlined text-2xl text-[#007a3d]">{icon}</span>
              <p className="mt-2 text-sm font-black text-[#172019]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="cursos" className="mx-auto max-w-7xl scroll-mt-32 px-5 py-8 sm:px-6 lg:px-8">
        {sectionTitle('Cursos destacados', 'Programas intensivos y masterclasses para potenciar tu creatividad.', 'Ver todos')}

        {computed.featuredPrograms.length ? (
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <article className="overflow-hidden rounded-lg border border-[#dfeadf] bg-white shadow-[0_16px_45px_rgba(29,65,35,0.08)]">
              <div className="grid md:grid-cols-[0.85fr_1fr]">
                <div className="relative min-h-72 bg-[#eaf3ea]">
                  <SchoolImage
                    src={computed.featuredPrograms[0].imageUrl}
                    alt={computed.featuredPrograms[0].name}
                    className="h-full w-full object-cover"
                    placeholder={<ImagePlaceholder icon="auto_stories" label="Imagen pendiente" className="h-full min-h-72 w-full" />}
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-[#007a3d] px-3 py-1 text-xs font-black text-white">Destacado</span>
                </div>
                <div className="p-5 sm:p-6">
                  <Badge variant="success">{MODALITY_LABELS[computed.featuredPrograms[0].modality] ?? computed.featuredPrograms[0].modality}</Badge>
                  <h3 className="mt-3 text-2xl font-black leading-tight text-[#151d18]">{computed.featuredPrograms[0].name}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#667267]">{computed.featuredPrograms[0].shortDescription}</p>
                  <div className="mt-5 grid gap-3 text-sm text-[#526156] sm:grid-cols-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">person</span>
                      Por el equipo docente
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">schedule</span>
                      {computed.featuredPrograms[0].duration}
                    </span>
                  </div>
                  <div className="mt-6 flex items-center justify-between gap-4">
                    <p>
                      <span className="block text-xs font-bold text-[#7a887b]">Precio mensual</span>
                      <span className="text-xl font-black text-[#151d18]">{formatPrice(computed.featuredPrograms[0])}</span>
                    </p>
                    <Link
                      to={`/programs/${computed.featuredPrograms[0].id}`}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-[#007a3d] px-5 text-sm font-bold text-white transition hover:bg-[#006432]"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            <div className="grid gap-4">
              {(computed.secondaryPrograms.length ? computed.secondaryPrograms : computed.featuredPrograms.slice(1)).map((program) => (
                <Link key={program.id} to={`/programs/${program.id}`} className="grid grid-cols-[92px_1fr] gap-4 rounded-lg border border-[#dfeadf] bg-white p-3 shadow-[0_12px_30px_rgba(29,65,35,0.06)] transition hover:border-[#007a3d]">
                  <SchoolImage
                    src={program.imageUrl}
                    alt={program.name}
                    className="h-24 w-full rounded-md object-cover"
                    placeholder={<ImagePlaceholder icon="auto_stories" label="" className="h-24 w-full rounded-md" />}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-[#007a3d]">{LEVEL_LABELS[program.level] ?? program.level}</p>
                    <h3 className="mt-1 line-clamp-2 font-black leading-tight text-[#151d18]">{program.name}</h3>
                    <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[#526156]">
                      <span className="material-symbols-outlined text-sm text-[#f5a524]">star</span>
                      4.8
                    </p>
                    <p className="mt-1 text-sm font-black text-[#151d18]">{formatPrice(program)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title="Sin cursos publicados" description="Esta escuela todavía no tiene programas activos." />
        )}
      </section>

      <section id="docentes" className="mx-auto max-w-7xl scroll-mt-32 px-5 py-8 sm:px-6 lg:px-8">
        {sectionTitle('Docentes destacados', 'Aprende con profesionales activos en la industria.', 'Ver todos')}

        {computed.featuredInstructors.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {computed.featuredInstructors.map((instructor: Instructor) => (
              <article key={instructor.id} className="rounded-lg border border-[#dfeadf] bg-white p-5 text-center shadow-[0_14px_35px_rgba(29,65,35,0.07)]">
                <SchoolImage
                  src={instructor.photoUrl}
                  alt={instructor.name}
                  className="mx-auto h-20 w-20 rounded-full object-cover"
                  placeholder={
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f5ec] text-xl font-black text-[#007a3d]">
                      {instructor.name.charAt(0)}
                    </div>
                  }
                />
                <h3 className="mt-4 font-black text-[#151d18]">{instructor.name}</h3>
                <p className="mt-1 text-sm text-[#667267]">{instructor.specialties}</p>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#5f6d61]">{instructor.bio}</p>
                <button className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-md border border-[#dce8dc] bg-white text-sm font-bold text-[#253429] transition hover:border-[#007a3d] hover:text-[#007a3d]">
                  Ver perfil profesional
                </button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin docentes publicados" description="La escuela todavía no tiene instructores activos." />
        )}
      </section>

      <section id="reels" className="mx-auto max-w-7xl scroll-mt-32 px-5 py-8 sm:px-6 lg:px-8">
        {sectionTitle('Explora nuestros Reels', 'Descubre clases, talleres, procesos creativos y momentos reales de la comunidad artística.')}
        {computed.videoAssets.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {computed.videoAssets.map((asset) => (
              <a
                key={asset.id}
                href={asset.url}
                target="_blank"
                rel="noreferrer"
                className="group relative flex aspect-[4/5] overflow-hidden rounded-lg bg-[#111811] p-5 text-white shadow-[0_18px_45px_rgba(29,65,35,0.1)]"
              >
                <div className="absolute inset-0 bg-[#172019]" />
                <span className="material-symbols-outlined absolute right-4 top-4 text-white/70">open_in_new</span>
                <div className="relative mt-auto">
                  <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#111811] transition group-hover:scale-105">
                    <span className="material-symbols-outlined text-3xl">play_arrow</span>
                  </span>
                  <h3 className="text-lg font-black leading-tight">{asset.caption || 'Video publicado por la escuela'}</h3>
                  <p className="mt-2 text-sm text-white/75">{school.name}</p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin reels publicados" description="Esta escuela todavía no ha agregado videos desde su panel de administración." />
        )}
      </section>

      <section id="fotos" className="mx-auto max-w-7xl scroll-mt-32 px-5 py-8 sm:px-6 lg:px-8">
        {sectionTitle('Conoce la escuela en imágenes', 'Espacios, instalaciones, muestras y momentos de la comunidad creativa.', 'Ver álbumes')}
        {computed.gallery.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {computed.gallery.slice(0, 12).map((asset, index) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => setLightboxUrl(asset.url)}
                className={`group relative overflow-hidden rounded-lg bg-[#eaf3ea] ${index === 0 || index === 5 ? 'sm:col-span-2 sm:row-span-2' : ''}`}
              >
                <img
                  src={asset.url}
                  alt={asset.caption ?? ''}
                  onError={hideBrokenImage}
                  className="aspect-[4/3] h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/35" />
                <span className="material-symbols-outlined absolute right-3 top-3 text-white opacity-0 transition group-hover:opacity-100">open_in_full</span>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin galería publicada" description="La escuela todavía no ha subido imágenes propias a su perfil." />
        )}
      </section>

      <section id="articulos" className="mx-auto max-w-7xl scroll-mt-32 px-5 py-8 sm:px-6 lg:px-8">
        {sectionTitle('Artículos', `Historias, enfoque pedagógico y novedades publicadas por ${school.name}.`)}

        {computed.publishedArticles.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {computed.publishedArticles.map((article) => (
              <article key={article.id} className="overflow-hidden rounded-lg border border-[#dfeadf] bg-white shadow-[0_16px_45px_rgba(29,65,35,0.08)]">
                <div className="aspect-[16/9] bg-[#e8f5ec]">
                  {article.coverImageUrl ? (
                    <img src={article.coverImageUrl} alt={article.title} onError={hideBrokenImage} className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlaceholder icon="article" label="Artículo" className="h-full w-full" />
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#007a3d]">{article.category || 'Artículo'}</p>
                  <h3 className="mt-2 line-clamp-2 text-xl font-black leading-tight text-[#151d18]">{article.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#667267]">{article.excerpt}</p>
                  {article.tags.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-[#e8f5ec] px-3 py-1 text-xs font-bold text-[#007a3d]">{tag}</span>
                      ))}
                    </div>
                  ) : null}
                  {article.videoUrl ? (
                    <a href={article.videoUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center text-sm font-black text-[#007a3d]">
                      Ver reel <span className="material-symbols-outlined ml-1 text-base">open_in_new</span>
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : computed.articleParagraphs.length ? (
          <article className="overflow-hidden rounded-lg border border-[#dfeadf] bg-white shadow-[0_16px_45px_rgba(29,65,35,0.08)]">
            <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="relative min-h-72 bg-[#e8f5ec]">
                {computed.articleImage ? (
                  <img
                    src={computed.articleImage}
                    alt={`Artículo de ${school.name}`}
                    onError={hideBrokenImage}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full min-h-72 items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-[#007a3d]">article</span>
                  </div>
                )}
                <span className="absolute left-4 top-4 rounded-full bg-[#007a3d] px-3 py-1 text-xs font-black text-white">
                  Publicado por la escuela
                </span>
              </div>

              <div className="p-6 sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#007a3d]">Artículo institucional</p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-[#151d18]">
                  La propuesta educativa de {school.name}
                </h2>
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-[#667267]">
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">school</span>
                    {school.city}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">schedule</span>
                    {Math.max(2, Math.ceil(computed.articleParagraphs.join(' ').split(/\s+/).length / 180))} min de lectura
                  </span>
                </div>

                <div className="mt-6 space-y-4 text-sm leading-7 text-[#526156]">
                  {computed.articleParagraphs.map((paragraph, index) => (
                    <p key={`${paragraph.slice(0, 24)}-${index}`}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ) : (
          <div className="rounded-lg border border-dashed border-[#cfe3d2] bg-white p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-[#007a3d]">article</span>
            <h3 className="mt-3 text-lg font-black text-[#151d18]">Sin artículos publicados</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#667267]">
              Esta escuela todavía no ha publicado su artículo institucional desde el panel de administración.
            </p>
          </div>
        )}
      </section>

      <section id="resenas" className="mx-auto max-w-7xl scroll-mt-32 px-5 py-8 sm:px-6 lg:px-8">
        {sectionTitle('Reseñas', computed.avgRating !== null ? `Calificación promedio ${computed.avgRating} de 5.` : 'Sé parte de las primeras opiniones de esta escuela.')}

        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {computed.reviews.length ? (
              computed.reviews.map((review: Review) => (
                <article key={review.id} className="rounded-lg border border-[#dfeadf] bg-white p-5 shadow-[0_12px_30px_rgba(29,65,35,0.06)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f5ec] text-sm font-black text-[#007a3d]">
                        {review.user?.firstName?.charAt(0) ?? 'A'}
                      </div>
                      <div>
                        <p className="font-black text-[#151d18]">
                          {review.user ? `${review.user.firstName} ${review.user.lastName.charAt(0)}.` : 'Anónimo'}
                        </p>
                        <p className="text-xs text-[#7a887b]">{relativeDate(review.createdAt)}</p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  {review.title && <p className="mt-4 font-bold text-[#151d18]">{review.title}</p>}
                  <p className="mt-2 text-sm leading-6 text-[#5f6d61]">{review.body}</p>
                </article>
              ))
            ) : (
              <EmptyState title="Sin reseñas aún" description="Sé el primero en compartir una experiencia." />
            )}
          </div>

          {canReview && (
            <form onSubmit={handleReviewSubmit} className="h-fit rounded-lg border border-[#dfeadf] bg-white p-5 shadow-[0_12px_30px_rgba(29,65,35,0.06)]">
              <h3 className="text-lg font-black text-[#151d18]">Deja tu reseña</h3>
              <div className="mt-4">
                <StarRating rating={reviewRating} interactive onChange={setReviewRating} />
              </div>
              <textarea
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                rows={5}
                placeholder="Comparte tu experiencia..."
                className="mt-4 w-full rounded-md border border-[#dce8dc] px-4 py-3 text-sm outline-none focus:border-[#007a3d]"
              />
              <button
                type="submit"
                disabled={reviewSubmitting || reviewRating === 0}
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#007a3d] text-sm font-black text-white transition hover:bg-[#006432] disabled:opacity-50"
              >
                {reviewSubmitting ? 'Enviando...' : 'Publicar reseña'}
              </button>
            </form>
          )}
        </div>
      </section>

      <section id="contacto" className="mx-auto max-w-7xl scroll-mt-32 px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
          <div className="rounded-lg border border-[#dfeadf] bg-white p-6 shadow-[0_12px_30px_rgba(29,65,35,0.06)]">
            <h2 className="text-2xl font-black text-[#151d18]">Contacto</h2>
            <div className="mt-5 grid gap-4 text-sm text-[#5f6d61] sm:grid-cols-2">
              <p className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#007a3d]">location_on</span>
                <span>{school.address}, {school.city}</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#007a3d]">call</span>
                <span>{school.phone}</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#007a3d]">forum</span>
                <span>{school.whatsapp}</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#007a3d]">mail</span>
                <span>{school.email}</span>
              </p>
              {school.generalSchedule && (
                <p className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#007a3d]">schedule</span>
                  <span>{school.generalSchedule}</span>
                </p>
              )}
              {school.website && (
                <a href={school.website} target="_blank" rel="noreferrer" className="flex items-start gap-3 text-[#007a3d] hover:underline">
                  <span className="material-symbols-outlined">language</span>
                  <span>{school.website}</span>
                </a>
              )}
            </div>
            {socialLinks.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {socialLinks.map(({ label, url }) => (
                  <a
                    key={label}
                    href={socialHref(label, url)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center rounded-full border border-[#dce8dc] px-4 text-xs font-black text-[#253429] transition hover:border-[#007a3d] hover:text-[#007a3d]"
                  >
                    {label}
                  </a>
                ))}
              </div>
            )}
            {school.trialClassMessage && (
              <div className="mt-6 rounded-lg border border-[#d1e7d4] bg-[#f3fcf3] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-[#007a3d]">Clase de prueba</p>
                <p className="mt-2 text-sm leading-6 text-[#5f6d61]">{school.trialClassMessage}</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-[#d1e7d4] bg-[#e8f5ec] p-6 shadow-[0_12px_30px_rgba(29,65,35,0.06)]">
            <h2 className="text-2xl font-black text-[#151d18]">{school.leadFormTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-[#5f6d61]">{school.leadFormDescription}</p>

            {leadSent ? (
              <div className="mt-6 rounded-md bg-white px-4 py-4 text-center text-sm font-bold text-[#007a3d]">
                Solicitud enviada. La escuela te contactará pronto.
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wide text-[#667267]">Nombre completo</label>
                  <input
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    required
                    className="mt-1 h-11 w-full rounded-md border border-[#dce8dc] bg-white px-4 text-sm outline-none focus:border-[#007a3d]"
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-[#667267]">Correo</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      required
                      className="mt-1 h-11 w-full rounded-md border border-[#dce8dc] bg-white px-4 text-sm outline-none focus:border-[#007a3d]"
                      placeholder="tu@correo.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-[#667267]">Teléfono</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) => setForm({ ...form, phone: event.target.value })}
                      required
                      className="mt-1 h-11 w-full rounded-md border border-[#dce8dc] bg-white px-4 text-sm outline-none focus:border-[#007a3d]"
                      placeholder="+34 600 000 000"
                    />
                  </div>
                </div>
                {computed.programs.length > 0 && (
                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-[#667267]">Programa de interés</label>
                    <select
                      value={form.programId}
                      onChange={(event) => setForm({ ...form, programId: event.target.value })}
                      className="mt-1 h-11 w-full rounded-md border border-[#dce8dc] bg-white px-4 text-sm outline-none focus:border-[#007a3d]"
                    >
                      <option value="">Sin preferencia</option>
                      {computed.programs.map((program) => (
                        <option key={program.id} value={program.id}>{program.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-xs font-black uppercase tracking-wide text-[#667267]">Contactar por</label>
                  <select
                    value={form.preferredContactMethod}
                    onChange={(event) => setForm({ ...form, preferredContactMethod: event.target.value as LeadForm['preferredContactMethod'] })}
                    className="mt-1 h-11 w-full rounded-md border border-[#dce8dc] bg-white px-4 text-sm outline-none focus:border-[#007a3d]"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Correo electrónico</option>
                    <option value="phone">Llamada</option>
                  </select>
                </div>
                <textarea
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  rows={4}
                  className="w-full rounded-md border border-[#dce8dc] bg-white px-4 py-3 text-sm outline-none focus:border-[#007a3d]"
                  placeholder="¿Qué quieres aprender?"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#007a3d] text-sm font-black text-white transition hover:bg-[#006432] disabled:opacity-60"
                >
                  {submitting ? 'Enviando...' : school.primaryCtaLabel}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 rounded-lg border border-[#d1e7d4] bg-[#007a3d] p-6 text-white shadow-[0_18px_45px_rgba(0,122,61,0.18)] sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-2xl font-black">{school.leadFormTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">{school.leadFormDescription}</p>
          </div>
          <a href="#contacto" className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-black text-[#007a3d] transition hover:bg-[#eef8ef]">
            {school.primaryCtaLabel}
          </a>
        </div>
      </section>

      {lightboxUrl && (
        <Modal open={!!lightboxUrl} onClose={() => setLightboxUrl(null)} title="Vista de imagen">
          <img src={lightboxUrl} alt="" className="max-h-[70vh] w-full rounded-lg object-contain" />
        </Modal>
      )}
    </main>
  );
}
