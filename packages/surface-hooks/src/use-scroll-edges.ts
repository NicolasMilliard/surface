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

export function useScrollEdges<
  T extends HTMLElement = HTMLElement,
>(): UseScrollEdgesResult<T> {
  const elementRef = useRef<T | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [edges, setEdges] = useState(initialEdges);

  const update = useCallback(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    setEdges({
      hasTopEdge: element.scrollTop > 0,
      hasBottomEdge:
        element.scrollHeight - element.clientHeight - element.scrollTop > 0,
      hasLeftEdge: element.scrollLeft > 0,
      hasRightEdge:
        element.scrollWidth - element.clientWidth - element.scrollLeft > 0,
    });
  }, []);

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

      cleanupRef.current = () => {
        element.removeEventListener('scroll', update);
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
