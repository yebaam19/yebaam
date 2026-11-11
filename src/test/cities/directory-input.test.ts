import { describe, expect, it } from 'vitest'
import { directorySections, validDirectoryInput, type DirectoryInput } from '@/features/cities/directory/types'

const valid: DirectoryInput = {
  id: 'e441b099-d4fd-4ba9-acf3-942de3935f0a', city_id: '37407eb6-2135-4ac2-9637-e41d6e112256',
  category: 'government', name: 'Public institution', description: '', address: '', phone: '',
  website: 'https://example.org', cover_cf_image_id: null, status: 'draft',
}
describe('administrator city directory input', () => {
  it('supports every one of the ten portal directory categories', () => {
    expect(directorySections).toHaveLength(10)
    for (const category of directorySections) expect(validDirectoryInput({ ...valid, category: category.id })).toBe(true)
  })
  it('rejects unsafe links, unknown status/categories and malformed references', () => {
    for (const patch of [
      { website: 'javascript:alert(1)' }, { website: 'https://user:pass@example.org' },
      { website: 'https://example.org bad' }, { category: 'unknown' }, { status: 'unknown' },
      { city_id: 'bad' }, { name: ' ' }, { description: 'x'.repeat(4001) },
      { cover_cf_image_id: 'https://imagedelivery.net/id/public' },
    ]) expect(validDirectoryInput({ ...valid, ...patch } as DirectoryInput)).toBe(false)
  })
})
