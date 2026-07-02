import { act, fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useScrollEdges } from '../src';

function setScrollMeasurements(
  element: HTMLElement,
  measurements: {
    clientHeight: number;
    clientWidth: number;
    scrollHeight: number;
    scrollLeft: number;
    scrollTop: number;
    scrollWidth: number;
  },
) {
  for (const [property, value] of Object.entries(measurements)) {
    Object.defineProperty(element, property, {
      configurable: true,
      value,
      writable: true,
    });
  }
}

describe('useScrollEdges', () => {
  it('calculates the initial vertical edges', () => {
    const { result } = renderHook(() => useScrollEdges<HTMLDivElement>());
    const element = document.createElement('div');

    setScrollMeasurements(element, {
      clientHeight: 100,
      clientWidth: 100,
      scrollHeight: 300,
      scrollLeft: 0,
      scrollTop: 0,
      scrollWidth: 100,
    });

    act(() => result.current.ref(element));

    expect(result.current).toMatchObject({
      hasTopEdge: false,
      hasBottomEdge: true,
      hasLeftEdge: false,
      hasRightEdge: false,
    });
  });

  it('updates the vertical edges when the container scrolls', () => {
    const { result } = renderHook(() => useScrollEdges<HTMLDivElement>());

    const element = document.createElement('div');

    setScrollMeasurements(element, {
      clientHeight: 100,
      clientWidth: 100,
      scrollHeight: 300,
      scrollLeft: 0,
      scrollTop: 0,
      scrollWidth: 100,
    });

    act(() => result.current.ref(element));

    element.scrollTop = 100;
    fireEvent.scroll(element);

    expect(result.current).toMatchObject({
      hasTopEdge: true,
      hasBottomEdge: true,
    });

    element.scrollTop = 200;
    fireEvent.scroll(element);

    expect(result.current).toMatchObject({
      hasTopEdge: true,
      hasBottomEdge: false,
    });
  });
});
