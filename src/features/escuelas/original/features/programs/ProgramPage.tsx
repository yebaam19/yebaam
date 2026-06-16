import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import type { ProgramDetail, EnrollmentLeadPayload, TrialClassPayload } from '../../types';

const MODALITY_LABELS: Record<string, string> = {
  PRESENTIAL: 'Presencial', VIRTUAL: 'Virtual', HYBRID: 'Híbrido',
};
const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Principiante', INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado', PROFESSIONAL: 'Profesional',
};
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

type LeadForm = { name: string; email: string; phone: string; message: string };
type TrialForm = { name: string; email: string; phone: string; preferredDate: string; message: string };
const EMPTY_LEAD: LeadForm = { name: '', email: '', phone: '', message: '' };
const EMPTY_TRIAL: TrialForm = { name: '', email: '', phone: '', preferredDate: '', message: '' };

function inputCls() {
  return 'mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#006b2d] focus:outline-none';
}
function labelCls() {
  return 'block text-xs font-semibold uppercase tracking-wide text-slate-500';
}

export default function ProgramPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [leadOpen, setLeadOpen] = useState(false);
  const [trialOpen, setTrialOpen] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadForm>(EMPTY_LEAD);
  const [trialForm, setTrialForm] = useState<TrialForm>(EMPTY_TRIAL);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<{ ok: boolean; data: ProgramDetail }>(`/programs/${id}`)
      .then((r) => setProgram(r.data.data))
      .catch((err: { message?: string }) => setError(err.message ?? 'Error al cargar el programa'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleLeadSubmit(e: FormEvent) {
    e.preventDefault();
    if (!program) return;
    setSubmitting(true);
    const payload: EnrollmentLeadPayload = {
      schoolId: program.schoolId,
      programId: program.id,
      name: leadForm.name,
      email: leadForm.email,
      phone: leadForm.phone,
      message: leadForm.message || undefined,
      preferredContactMethod: 'whatsapp',
    };
    try {
      await api.post('/leads', payload);
      showToast('¡Solicitud enviada! La escuela te contactará pronto.', 'success');
      setLeadOpen(false);
      setLeadForm(EMPTY_LEAD);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'Error al enviar', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTrialSubmit(e: FormEvent) {
    e.preventDefault();
    if (!program) return;
    setSubmitting(true);
    const payload: TrialClassPayload = {
      schoolId: program.schoolId,
      programId: program.id,
      name: trialForm.name,
      email: trialForm.email,
      phone: trialForm.phone,
      preferredDate: trialForm.preferredDate,
      message: trialForm.message || undefined,
    };
    try {
      await api.post('/trial-classes', payload);
      showToast('¡Clase de prueba solicitada! La escuela confirmará la fecha.', 'success');
      setTrialOpen(false);
      setTrialForm(EMPTY_TRIAL);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'Error al enviar', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-6 py-12 space-y-6">
        <SkeletonCard />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>
    );
  }
  if (error) return <EmptyState title="Error" description={error} />;
  if (!program) return <EmptyState title="Programa no encontrado" description="Verifica la URL." />;

  const { school, instructor, campus, scheduleSlots, mediaAssets, discipline } = program;

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#e8f5ec] to-[#f3fcf3]">
        {program.imageUrl && (
          <img src={program.imageUrl} alt={program.name}
            className="absolute inset-0 h-full w-full object-cover opacity-20" />
        )}
        <div className="relative px-8 py-12">
          <div className="flex flex-wrap gap-2 mb-4">
            {discipline && <Badge variant="default">{discipline.name}</Badge>}
            <Badge variant="info">{MODALITY_LABELS[program.modality] ?? program.modality}</Badge>
            <Badge variant="warning">{LEVEL_LABELS[program.level] ?? program.level}</Badge>
            {program.trialClassAvailable && <Badge variant="success">Clase de prueba disponible</Badge>}
          </div>
          <h1 className="text-4xl font-bold text-slate-900">{program.name}</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">{program.shortDescription}</p>
          <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-600">
            {program.ageRange && (
              <span><strong>Edad:</strong> {program.ageRange}</span>
            )}
            {program.duration && (
              <span><strong>Duración:</strong> {program.duration}</span>
            )}
            {program.scheduleSummary && (
              <span><strong>Horario:</strong> {program.scheduleSummary}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Description */}
          <Card>
            <h2 className="text-xl font-semibold">Sobre el programa</h2>
            <p className="mt-3 text-slate-700 leading-relaxed">{program.description}</p>
          </Card>

          {/* Schedule slots */}
          {scheduleSlots.length > 0 && (
            <Card>
              <h2 className="text-xl font-semibold">Horarios</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-2 text-left font-semibold text-slate-500">Día</th>
                      <th className="pb-2 text-left font-semibold text-slate-500">Inicio</th>
                      <th className="pb-2 text-left font-semibold text-slate-500">Fin</th>
                      <th className="pb-2 text-left font-semibold text-slate-500">Plazas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {scheduleSlots.map((slot) => (
                      <tr key={slot.id}>
                        <td className="py-2 text-slate-700">{WEEKDAYS[slot.weekday] ?? slot.weekday}</td>
                        <td className="py-2 text-slate-700">{slot.startsAt}</td>
                        <td className="py-2 text-slate-700">{slot.endsAt}</td>
                        <td className="py-2 text-slate-500">{slot.capacity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Instructor */}
          {instructor && (
            <Card>
              <h2 className="text-xl font-semibold">Instructor</h2>
              <div className="mt-4 flex gap-4">
                {instructor.photoUrl ? (
                  <img src={instructor.photoUrl} alt={instructor.name}
                    className="h-16 w-16 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f5ec] text-xl font-bold text-[#006b2d] shrink-0">
                    {instructor.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900">{instructor.name}</p>
                  {instructor.specialties && (
                    <p className="text-sm text-slate-500">{instructor.specialties}</p>
                  )}
                  {instructor.bio && (
                    <p className="mt-2 text-sm text-slate-600">{instructor.bio}</p>
                  )}
                  {instructor.instagram && (
                    <a href={`https://instagram.com/${instructor.instagram.replace('@', '')}`}
                      target="_blank" rel="noreferrer"
                      className="mt-1 inline-block text-sm text-[#006b2d] hover:underline">
                      @{instructor.instagram.replace('@', '')}
                    </a>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Campus */}
          {campus && (
            <Card>
              <h2 className="text-xl font-semibold">Sede</h2>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{campus.name}</p>
                <p>{campus.address}</p>
                <p>{campus.city}</p>
                {campus.phone && <p>{campus.phone}</p>}
              </div>
              {campus.latitude && campus.longitude && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${campus.latitude},${campus.longitude}`}
                  target="_blank" rel="noreferrer"
                  className="mt-3 inline-block text-sm text-[#006b2d] hover:underline"
                >
                  Ver en Google Maps →
                </a>
              )}
            </Card>
          )}

          {/* Media gallery */}
          {mediaAssets.length > 0 && (
            <Card>
              <h2 className="text-xl font-semibold">Galería</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {mediaAssets.filter((a) => a.type === 'IMAGE').map((asset) => (
                  <img key={asset.id} src={asset.url} alt={asset.caption ?? ''}
                    className="aspect-video w-full rounded-xl object-cover" />
                ))}
              </div>
            </Card>
          )}

          {/* School card */}
          <Card>
            <h2 className="text-xl font-semibold">Escuela</h2>
            <div className="mt-4 flex items-center gap-4">
              {school.profileImageUrl ? (
                <img src={school.profileImageUrl} alt={school.name}
                  className="h-14 w-14 rounded-2xl object-cover shrink-0" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f5ec] text-lg font-bold text-[#006b2d] shrink-0">
                  {school.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{school.name}</p>
                  {school.isVerified && <Badge variant="success">Verificada</Badge>}
                </div>
                <p className="text-sm text-slate-500">{school.city}</p>
              </div>
            </div>
            <Link
              to={`/schools/${school.id}`}
              className="mt-4 inline-block text-sm text-[#006b2d] hover:underline"
            >
              Ver perfil de la escuela →
            </Link>
          </Card>
        </div>

        {/* Sticky sidebar */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="border-[#d5e9d7] bg-[#f6fef7]">
            {/* Pricing */}
            <div className="mb-6">
              <p className="text-3xl font-bold text-slate-900">
                {program.monthlyPrice != null
                  ? `${program.currency} ${program.monthlyPrice}`
                  : 'Consultar precio'}
                {program.monthlyPrice != null && (
                  <span className="text-base font-normal text-slate-500">/mes</span>
                )}
              </p>
              {program.registrationFee != null && program.registrationFee > 0 && (
                <p className="mt-1 text-sm text-slate-500">
                  Matrícula: {program.currency} {program.registrationFee}
                </p>
              )}
              {program.materialsIncluded && (
                <p className="mt-1 text-xs text-[#006b2d] font-medium">✓ Materiales incluidos</p>
              )}
              {!program.enrollmentOpen && (
                <p className="mt-1 text-xs text-orange-500 font-medium">Inscripción actualmente cerrada</p>
              )}
            </div>

            <button
              onClick={() => setLeadOpen(true)}
              className="w-full rounded-full bg-[#006b2d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#005723]"
            >
              Solicitar información
            </button>

            {program.trialClassAvailable && (
              <button
                onClick={() => setTrialOpen(true)}
                className="mt-3 w-full rounded-full border border-[#006b2d] px-6 py-3 text-sm font-semibold text-[#006b2d] transition hover:bg-[#e8f5ec]"
              >
                Agendar clase de prueba
              </button>
            )}
          </Card>
        </div>
      </div>

      {/* Enrollment lead modal */}
      <Modal open={leadOpen} onClose={() => setLeadOpen(false)} title="Solicitar información">
        <form onSubmit={handleLeadSubmit} className="space-y-4">
          <div>
            <label className={labelCls()}>Nombre completo</label>
            <input value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
              required className={inputCls()} placeholder="Tu nombre" />
          </div>
          <div>
            <label className={labelCls()}>Correo electrónico</label>
            <input type="email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
              required className={inputCls()} placeholder="tu@correo.com" />
          </div>
          <div>
            <label className={labelCls()}>Teléfono</label>
            <input type="tel" value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
              required className={inputCls()} placeholder="+34 600 000 000" />
          </div>
          <div>
            <label className={labelCls()}>Mensaje (opcional)</label>
            <textarea value={leadForm.message} onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
              rows={3} className={inputCls()} placeholder="¿Tienes alguna pregunta?" />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full rounded-full bg-[#006b2d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#005723] disabled:opacity-60">
            {submitting ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </form>
      </Modal>

      {/* Trial class modal */}
      <Modal open={trialOpen} onClose={() => setTrialOpen(false)} title="Agendar clase de prueba">
        <form onSubmit={handleTrialSubmit} className="space-y-4">
          <div>
            <label className={labelCls()}>Nombre completo</label>
            <input value={trialForm.name} onChange={(e) => setTrialForm({ ...trialForm, name: e.target.value })}
              required className={inputCls()} placeholder="Tu nombre" />
          </div>
          <div>
            <label className={labelCls()}>Correo electrónico</label>
            <input type="email" value={trialForm.email} onChange={(e) => setTrialForm({ ...trialForm, email: e.target.value })}
              required className={inputCls()} placeholder="tu@correo.com" />
          </div>
          <div>
            <label className={labelCls()}>Teléfono</label>
            <input type="tel" value={trialForm.phone} onChange={(e) => setTrialForm({ ...trialForm, phone: e.target.value })}
              required className={inputCls()} placeholder="+34 600 000 000" />
          </div>
          <div>
            <label className={labelCls()}>Fecha preferida</label>
            <input type="date" value={trialForm.preferredDate} onChange={(e) => setTrialForm({ ...trialForm, preferredDate: e.target.value })}
              required className={inputCls()} min={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label className={labelCls()}>Mensaje (opcional)</label>
            <textarea value={trialForm.message} onChange={(e) => setTrialForm({ ...trialForm, message: e.target.value })}
              rows={2} className={inputCls()} placeholder="¿Algo que debamos saber?" />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full rounded-full bg-[#006b2d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#005723] disabled:opacity-60">
            {submitting ? 'Enviando...' : 'Confirmar solicitud'}
          </button>
        </form>
      </Modal>
    </section>
  );
}
