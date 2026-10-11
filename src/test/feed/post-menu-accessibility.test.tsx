import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import es from '../../../messages/es/feed.json';
import en from '../../../messages/en/feed.json';
import { PostCardHeader } from '@/app/(app)/feed/post/components/post-card/PostCardHeader';
import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces';

const post: Post = {
  id: 'post-1',
  author: { id: 'author-1', username: 'ana', firstName: 'Ana', lastName: 'Gómez' },
  content: 'Una publicación',
  mediaFiles: [],
  privacy: { value: 'public' },
  reactionsCount: { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
  createdAt: '2026-10-01T12:00:00Z',
  updatedAt: '2026-10-01T12:00:00Z',
};

describe('post menu accessible name', () => {
  it.each([
    { locale: 'es', messages: es, expected: 'Opciones de la publicación de Ana Gómez' },
    { locale: 'en', messages: en, expected: "Options for Ana Gómez's post" },
  ])('identifies the author in $locale', ({ locale, messages, expected }) => {
    render(<NextIntlClientProvider locale={locale} messages={{ feed: messages }}>
      <PostCardHeader post={post} isOwner isOptimistic={false} onEdit={vi.fn()} onDeleteClick={vi.fn()} />
    </NextIntlClientProvider>);
    expect(screen.getByRole('button', { name: expected })).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('identifies the business instead of its administrator', () => {
    render(<NextIntlClientProvider locale="es" messages={{ feed: es }}>
      <PostCardHeader
        post={{ ...post, businessId: 'business-1', businessName: 'Café Central' }}
        isOwner={false} isOptimistic={false} onEdit={vi.fn()} onDeleteClick={vi.fn()}
      />
    </NextIntlClientProvider>);
    expect(screen.getByRole('button', {
      name: 'Opciones de la publicación de Café Central',
    })).toBeVisible();
  });
});
