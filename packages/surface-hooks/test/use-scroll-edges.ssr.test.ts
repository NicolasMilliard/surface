// @vitest-environment node

import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useScrollEdges } from '../src';

describe('useScrollEdges SSR', () => {
  it('renders without browser globals', () => {
    function TestComponent() {
      useScrollEdges<HTMLDivElement>();
      return null;
    }

    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');

    expect(() => {
      renderToString(createElement(TestComponent));
    }).not.toThrow();
  });
});
