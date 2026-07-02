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

  it('updates the horizontal edges when the container scrolls', () => {
    const { result } = renderHook(() => useScrollEdges<HTMLDivElement>());

    const element = document.createElement('div');

    setScrollMeasurements(element, {
      clientHeight: 100,
      clientWidth: 100,
      scrollHeight: 100,
      scrollLeft: 0,
      scrollTop: 0,
      scrollWidth: 300,
    });

    act(() => result.current.ref(element));

    expect(result.current).toMatchObject({
      hasLeftEdge: false,
      hasRightEdge: true,
    });

    element.scrollLeft = 100;
    fireEvent.scroll(element);

    expect(result.current).toMatchObject({
      hasLeftEdge: true,
      hasRightEdge: true,
    });

    element.scrollLeft = 200;
    fireEvent.scroll(element);

    expect(result.current).toMatchObject({
      hasLeftEdge: true,
      hasRightEdge: false,
    });
  });

  it('reports no edges when the container is not scrollable', () => {
    const { result } = renderHook(() => useScrollEdges<HTMLDivElement>());

    const element = document.createElement('div');

    setScrollMeasurements(element, {
      clientHeight: 100,
      clientWidth: 100,
      scrollHeight: 100,
      scrollLeft: 0,
      scrollTop: 0,
      scrollWidth: 100,
    });

    act(() => result.current.ref(element));

    expect(result.current).toMatchObject({
      hasTopEdge: false,
      hasBottomEdge: false,
      hasLeftEdge: false,
      hasRightEdge: false,
    });
  });

  it('applies the default and configurable measurement tolerance', () => {
    const defaultTolerance = renderHook(() => useScrollEdges<HTMLDivElement>());
    const exactTolerance = renderHook(() =>
      useScrollEdges<HTMLDivElement>({ tolerance: 0 }),
    );

    const defaultElement = document.createElement('div');
    const exactElement = document.createElement('div');

    const measurements = {
      clientHeight: 100,
      clientWidth: 100,
      scrollHeight: 200.5,
      scrollLeft: 0,
      scrollTop: 100,
      scrollWidth: 100,
    };

    setScrollMeasurements(defaultElement, measurements);
    setScrollMeasurements(exactElement, measurements);

    act(() => {
      defaultTolerance.result.current.ref(defaultElement);
      exactTolerance.result.current.ref(exactElement);
    });

    expect(defaultTolerance.result.current.hasBottomEdge).toBe(false);
    expect(exactTolerance.result.current.hasBottomEdge).toBe(true);
  });
});
