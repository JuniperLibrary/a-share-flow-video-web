import { useEffect, useMemo, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(SplitText, DrawSVGPlugin);

export type { SplitText, DrawSVGPlugin };

/**
 * Bridge between Remotion's deterministic frame model and GSAP timelines.
 *
 * GSAP runs on the real browser clock and tweens DOM directly; Remotion renders
 * frames out of order and rebuilds the DOM per frame. So we never let GSAP touch
 * the DOM. Instead we animate a PLAIN OBJECT (the proxy) with a paused GSAP
 * timeline and `seek()` it to `frame / fps` during render. GSAP owns the
 * timeline / easing / stagger math; React reads the proxy values to style nodes.
 *
 * seek() of a paused timeline synchronously mutates the proxy, so this is a
 * pure function of `frame` — deterministic in Studio and in headless render.
 */
export interface GsapProxy {
  [key: string]: number;
}

export function useGsapState<T extends GsapProxy>(
  frame: number,
  setup: (proxy: T, t: gsap.core.Timeline, fps: number) => void,
  deps: React.DependencyList,
  options: { durationCap?: number } = {},
): T {
  const { fps } = useVideoConfig();

  const { proxy, timeline } = useMemo<{ proxy: T; timeline: gsap.core.Timeline }>(() => {
    const proxy = {} as T;
    const timeline = gsap.timeline({ paused: true });
    setup(proxy, timeline, fps);
    return { proxy, timeline };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Mutate the proxy synchronously from the current frame. Safe: paused
  // timeline seek is deterministic and side-effect-free on the DOM.
  const time = Math.min(frame, options.durationCap ?? Number.MAX_SAFE_INTEGER) / fps;
  timeline.seek(time);

  useEffect(() => {
    return () => {
      timeline.kill();
    };
  }, [timeline]);

  return proxy;
}

/** Convenience wrapper reading the frame automatically. */
export function useCurrentGsapState<T extends GsapProxy>(
  setup: (proxy: T, t: gsap.core.Timeline, fps: number) => void,
  deps: React.DependencyList,
  options: { durationCap?: number } = {},
): T {
  const frame = useCurrentFrame();
  return useGsapState(frame, setup, deps, options);
}

/**
 * Camera-style entrance: translate + opacity + blur + scale driven by a paused
 * timeline with an Expo-style ease. Returns numeric values ready for styles.
 */
export const useEntrance = (frame: number, delay = 0, duration = 1): { opacity: number; y: number; scale: number; blur: number } => {
  return useGsapState(
    frame,
    (p, t) => {
      t.fromTo(p, { opacity: 0, y: 28, scale: 1.04, blur: 8 }, { opacity: 1, y: 0, scale: 1, blur: 0, duration, ease: 'power4.out' }, delay);
    },
    [delay, duration],
  );
};

/** Temporary debug helper. */
export function useTimelineDebug(proxy: Record<string, number> | null, label = 'tl'): void {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  useEffect(() => {
    if (!proxy) return;
    if (frame % Math.max(1, Math.floor(fps * 0.5)) === 0 && frame < 8) {
      // eslint-disable-next-line no-console
      console.log(`[${label}] frame=${frame} proxy=`, { ...proxy });
    }
  }, [proxy, frame, fps, label]);
}