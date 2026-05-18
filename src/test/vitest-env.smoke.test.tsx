import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('vitest jsdom env', () => {
  it('renders a basic div', () => {
    const { container } = render(<div data-testid="hello">hi</div>);
    expect(container.textContent).toBe('hi');
  });
});
