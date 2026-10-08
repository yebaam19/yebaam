import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../messages/es/communities.json';
import { QuestionForm } from '@/features/communities/components/questions/QuestionForm';
import { QuestionDetail } from '@/features/communities/components/questions/QuestionDetail';
import { QuestionsIndex } from '@/features/communities/components/questions/QuestionsIndex';
import { QuestionCategories } from '@/features/communities/components/questions/QuestionCategories';
import type { CommunityQuestion, QuestionAnswer } from '@/features/communities/types/communityQuestion.types';
const mocks = vi.hoisted(() => ({ save: vi.fn(), answer: vi.fn(), category: vi.fn(), change: vi.fn(), changeAnswer: vi.fn(), load: vi.fn(), loadAnswers: vi.fn(), categories: vi.fn(), refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh, push: mocks.push, replace: mocks.replace }) }));
vi.mock('@/features/communities/actions/questions/write.actions', () => ({ saveCommunityQuestion: mocks.save, saveQuestionAnswer: mocks.answer, saveQuestionCategory: mocks.category, changeCommunityQuestion: mocks.change, changeQuestionAnswer: mocks.changeAnswer }));
vi.mock('@/features/communities/actions/questions/read.actions', () => ({ loadCommunityQuestions: mocks.load, loadQuestionAnswers: mocks.loadAnswers, loadQuestionCategories: mocks.categories }));
const id = '11111111-1111-4111-8111-111111111111';
const time = '2026-10-01T10:00:00Z';
const empty = { items: [], nextCursor: null };
const question: CommunityQuestion = { id, community_id: id, author_id: id, author_name: 'Autora', category_id: null, title: '¿Cómo participar?', body: 'Necesito información.', is_published: true, is_closed: false, is_faq: false, hidden_at: null, moderation_reason: '', version: 1, created_at: time, updated_at: time };
const answer: QuestionAnswer = { id, community_id: id, question_id: id, author_id: id, author_name: 'Delegada', body: 'Respuesta inicial', is_published: true, hidden_at: null, moderation_reason: '', version: 1, created_at: time, updated_at: time };
const detail = { question, slug: 'test', userId: id, canAnswer: true, canModerate: true, answers: { items: [answer], nextCursor: null }, categories: empty, category: null };
function Wrapper({ children }: { children: ReactNode }) { return <NextIntlClientProvider locale="es" messages={{ communities: messages }}>{children}</NextIntlClientProvider>; }
function show(child: ReactNode) { return render(child, { wrapper: Wrapper }); }
beforeEach(() => {
  vi.resetAllMocks();
  mocks.save.mockResolvedValue({ ok: false, error: 'No se pudo guardar.' });
  for (const action of [mocks.answer, mocks.category, mocks.change, mocks.changeAnswer]) action.mockResolvedValue({ ok: true, data: { id, version: 2 } });
  mocks.categories.mockResolvedValue({ ok: true, data: empty });
});
describe('Question workflows', () => {
  it('defaults to private and retains fields and stable creation id after failure', async () => {
    show(<QuestionForm communityId={id} slug="test" categories={empty} />);
    expect(screen.getByLabelText(/Publicar en la comunidad/)).not.toBeChecked();
    fireEvent.change(screen.getByLabelText('Título de la pregunta'), { target: { value: '¿Cómo participar?' } });
    fireEvent.change(screen.getByLabelText('Tu pregunta'), { target: { value: 'Necesito información.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar pregunta' }));
    await screen.findByText('No se pudo guardar.');
    expect(screen.getByLabelText('Tu pregunta')).toHaveValue('Necesito información.');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar pregunta' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Guardar pregunta' }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
    expect(mocks.save.mock.calls[0][0].id).toBe(mocks.save.mock.calls[1][0].id);
    expect(mocks.save.mock.calls[0][0]).toMatchObject({ isPublished: false, categoryId: null, expectedVersion: 0 });
  });
  it('requires moderation reason, blocks competing edits and restores focus on cancel', async () => {
    show(<QuestionDetail {...detail} answers={empty} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar' }));
    expect(screen.getByRole('button', { name: 'Responder como comunidad' })).toBeDisabled();
    expect(screen.getByLabelText('Motivo')).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(mocks.change).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Contenido duplicado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(mocks.change).toHaveBeenCalledWith(expect.objectContaining({ operation: 'hide', reason: 'Contenido duplicado', confirmed: true })));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ocultar' })).toHaveFocus());
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: 'Eliminar' })).toHaveFocus();
  });
  it('keeps an answer draft after errors and updates server rows without remounting focus', async () => {
    mocks.answer.mockResolvedValueOnce({ ok: false, error: 'Conflicto de versión.' }).mockResolvedValueOnce({ ok: true, data: { id, version: 2 } });
    const view = show(<QuestionDetail {...detail} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar respuesta' }));
    fireEvent.change(screen.getByLabelText('Respuesta de la comunidad'), { target: { value: 'Respuesta corregida' } });
    expect(screen.getByRole('button', { name: 'Marcar como resuelta' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar respuesta' }));
    await screen.findByText('Conflicto de versión.');
    expect(screen.getByLabelText('Respuesta de la comunidad')).toHaveValue('Respuesta corregida');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar respuesta' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Guardar respuesta' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar respuesta' })).toHaveFocus());
    view.rerender(<QuestionDetail {...detail} answers={{ items: [{ ...answer, body: 'Respuesta corregida', version: 2 }], nextCursor: null }} />);
    expect(screen.getByText('Respuesta corregida')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar respuesta' })).toHaveFocus();
  });
  it('does not offer official answers or moderation to ordinary readers, or edit on closed questions', () => {
    show(<QuestionDetail {...detail} userId="reader" canAnswer={false} canModerate={false} question={{ ...question, is_closed: true }} />);
    expect(screen.getByText('Respuesta oficial')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Responder como comunidad' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ocultar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar pregunta' })).not.toBeInTheDocument();
  });
  it('preserves listed questions after pagination failure and serializes filters', async () => {
    mocks.load.mockRejectedValue(new Error('offline'));
    show(<QuestionsIndex slug="test" query={{ communityId: id, search: '', view: 'all', state: 'all', cursor: null }}
      initial={{ items: [question], nextCursor: { id, createdAt: time } }} categories={empty} category={null} signedIn canAnswer={false} canModerate={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cargar más preguntas' }));
    await screen.findByText(messages.questions.loadError);
    expect(screen.getByRole('link', { name: question.title })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Mostrar'), { target: { value: 'mine' } });
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(mocks.push).toHaveBeenCalledWith('/feed/comunidades/test/preguntas?view=mine&state=all&category=none');
    fireEvent.change(screen.getByLabelText('Buscar preguntas'), { target: { value: 'sin enviar' } });
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(screen.getByLabelText('Buscar preguntas')).toHaveValue('');
    expect(screen.getByLabelText('Mostrar')).toHaveValue('all');
    expect(screen.getByLabelText('Categoría')).toHaveValue('*');
  });
  it('focuses category selection and preserves selection outside first page', () => {
    const category = { id, community_id: id, title: 'Participación', position: 40, is_published: true, version: 1 };
    show(<QuestionDetail {...detail} question={{ ...question, category_id: id }} category={category} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar categoría' }));
    expect(screen.getByLabelText('Categoría')).toHaveFocus();
    expect(screen.getByLabelText('Categoría')).toHaveValue(id);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: 'Cambiar categoría' })).toHaveFocus();
  });
  it('keeps category publication explicit and restores focus after cancellation', () => {
    show(<QuestionCategories communityId={id} slug="test" initial={empty} />);
    fireEvent.click(screen.getByRole('button', { name: 'Crear categoría' }));
    expect(screen.getByLabelText('Hacer visible la categoría')).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: 'Crear categoría' })).toHaveFocus();
  });
});
