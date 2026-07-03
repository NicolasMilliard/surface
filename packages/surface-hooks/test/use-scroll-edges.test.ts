import { act, fireEvent, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

function installResizeObserverMock() {
  let callback: ResizeObserverCallback | undefined;
  const observe = vi.fn();
  const disconnect = vi.fn();

  class ResizeObserverMock {
    constructor(nextCallback: ResizeObserverCallback) {
      callback = nextCallback;
    }

    observe = observe;
    disconnect = disconnect;
    unobserve = vi.fn();
  }

  vi.stubGlobal('ResizeObserver', ResizeObserverMock);

  return {
    observe,
    disconnect,
    trigger() {
      if (!callback) {
        throw new Error('ResizeObserver has not been created');
      }
      callback([], {} as ResizeObserver);
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

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

  it('updates the edges when the window resizes', () => {
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

    expect(result.current.hasBottomEdge).toBe(false);

    setScrollMeasurements(element, {
      clientHeight: 100,
      clientWidth: 100,
      scrollHeight: 300,
      scrollLeft: 0,
      scrollTop: 0,
      scrollWidth: 100,
    });

    fireEvent.resize(window);

    expect(result.current.hasBottomEdge).toBe(true);
  });

  it('updates when the observed container size changes', () => {
    const resizeObserver = installResizeObserverMock();

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

    setScrollMeasurements(element, {
      clientHeight: 100,
      clientWidth: 100,
      scrollHeight: 300,
      scrollLeft: 0,
      scrollTop: 0,
      scrollWidth: 100,
    });

    act(() => {
      resizeObserver.trigger();
    });

    expect(resizeObserver.observe).toHaveBeenCalledWith(element);
    expect(result.current.hasBottomEdge).toBe(true);
  });

  it('updates when existing content changes size', () => {
    const resizeObserver = installResizeObserverMock();
    const { result } = renderHook(() => useScrollEdges<HTMLDivElement>());

    const element = document.createElement('div');
    const content = document.createElement('div');

    element.append(content);

    setScrollMeasurements(element, {
      clientHeight: 100,
      clientWidth: 100,
      scrollHeight: 100,
      scrollLeft: 0,
      scrollTop: 0,
      scrollWidth: 100,
    });

    act(() => result.current.ref(element));

    expect(resizeObserver.observe).toHaveBeenCalledWith(element);
    expect(resizeObserver.observe).toHaveBeenCalledWith(content);

    setScrollMeasurements(element, {
      clientHeight: 100,
      clientWidth: 100,
      scrollHeight: 300,
      scrollLeft: 0,
      scrollTop: 0,
      scrollWidth: 100,
    });

    act(() => {
      resizeObserver.trigger();
    });

    expect(result.current.hasBottomEdge).toBe(true);
  });

  it('updates when content is added after attachment', async () => {
    const resizeObserver = installResizeObserverMock();
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

    const content = document.createElement('div');

    setScrollMeasurements(element, {
      clientHeight: 100,
      clientWidth: 100,
      scrollHeight: 300,
      scrollLeft: 0,
      scrollTop: 0,
      scrollWidth: 100,
    });

    await act(async () => {
      element.append(content);
      await Promise.resolve();
    });

    expect(resizeObserver.observe).toHaveBeenCalledWith(content);
    expect(result.current.hasBottomEdge).toBe(true);
  });

  it('preserves the result when the edge values have not changed', () => {
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

    const resultAfterMeasurement = result.current;

    fireEvent.scroll(element);

    expect(result.current).toBe(resultAfterMeasurement);
  });

  it('cleans up listeners and observers when unmounted', () => {
    const resizeObserver = installResizeObserverMock();
    const mutationDisconnect = vi.spyOn(
      MutationObserver.prototype,
      'disconnect',
    );

    const element = document.createElement('div');
    const elementRemoveListener = vi.spyOn(element, 'removeEventListener');
    const windowRemoveListener = vi.spyOn(window, 'removeEventListener');

    const { result, unmount } = renderHook(() =>
      useScrollEdges<HTMLDivElement>(),
    );

    act(() => result.current.ref(element));
    unmount();

    expect(elementRemoveListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
    );
    expect(windowRemoveListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function),
    );
    expect(resizeObserver.disconnect).toHaveBeenCalledOnce();
    expect(mutationDisconnect).toHaveBeenCalledOnce();
  });

  it('supports manually updating after an imperative layout change', () => {
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

    expect(result.current.hasBottomEdge).toBe(false);

    setScrollMeasurements(element, {
      clientHeight: 100,
      clientWidth: 100,
      scrollHeight: 300,
      scrollLeft: 0,
      scrollTop: 0,
      scrollWidth: 100,
    });

    act(() => result.current.update());

    expect(result.current.hasBottomEdge).toBe(true);
  });
});
