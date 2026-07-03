import {
  type RefCallback,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export interface ScrollEdges {
  hasTopEdge: boolean;
  hasBottomEdge: boolean;
  hasLeftEdge: boolean;
  hasRightEdge: boolean;
}

export interface UseScrollEdgesOptions {
  tolerance?: number;
}

export interface UseScrollEdgesResult<
  T extends HTMLElement,
> extends ScrollEdges {
  ref: RefCallback<T>;
  update: () => void;
}

const initialEdges: ScrollEdges = {
  hasTopEdge: false,
  hasBottomEdge: false,
  hasLeftEdge: false,
  hasRightEdge: false,
};

export function useScrollEdges<T extends HTMLElement = HTMLElement>(
  options: UseScrollEdgesOptions = {},
): UseScrollEdgesResult<T> {
  const tolerance = Math.max(0, options.tolerance ?? 1);
  const elementRef = useRef<T | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [edges, setEdges] = useState(initialEdges);

  const update = useCallback(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    setEdges({
      hasTopEdge: element.scrollTop > tolerance,
      hasBottomEdge:
        element.scrollHeight - element.clientHeight - element.scrollTop >
        tolerance,
      hasLeftEdge: element.scrollLeft > tolerance,
      hasRightEdge:
        element.scrollWidth - element.clientWidth - element.scrollLeft >
        tolerance,
    });
  }, [tolerance]);

  const ref = useCallback<RefCallback<T>>(
    (element) => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      elementRef.current = element;

      if (!element) {
        return;
      }

      element.addEventListener('scroll', update, {
        passive: true,
      });

      const ownerWindow = element.ownerDocument.defaultView;
      ownerWindow?.addEventListener('resize', update);

      const resizeObserver =
        typeof ResizeObserver === 'undefined'
          ? null
          : new ResizeObserver(update);
      resizeObserver?.observe(element);

      cleanupRef.current = () => {
        element.removeEventListener('scroll', update);
        ownerWindow?.removeEventListener('resize', update);
        resizeObserver?.disconnect();
      };

      update();
    },
    [update],
  );

  useEffect(
    () => () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      elementRef.current = null;
    },
    [],
  );

  return {
    ref,
    ...edges,
    update,
  };
}
