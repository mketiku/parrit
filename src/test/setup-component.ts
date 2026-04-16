import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock Supabase client globally — prevents `supabaseUrl is required`
// from crashing test suites that import Supabase at module level.
vi.mock('@/lib/supabase');

// Mock zustand persist middleware globally for all tests to handle localStorage unavailability
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock('zustand/middleware', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    persist: (config: any) => (set: any, get: any, api: any) =>
      config(set, get, api),
  };
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock framer-motion globally to avoid prop leakage warnings and animation issues in tests
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock('framer-motion', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  const React = await import('react');

  const filterProps = (props: Record<string, unknown>) => {
    const filtered = { ...props };
    const propsToFilter = [
      'layout',
      'layoutId',
      'initial',
      'animate',
      'exit',
      'transition',
      'variants',
      'whileHover',
      'whileTap',
      'whileInView',
      'whileFocus',
      'whileDrag',
      'drag',
      'dragConstraints',
      'dragElastic',
      'dragMomentum',
      'onDragStart',
      'onDragEnd',
      'onDrag',
      'viewport',
      'onViewportEnter',
      'onViewportLeave',
      'onAnimationStart',
      'onAnimationComplete',
      'onUpdate',
      'onLayoutAnimationComplete',
    ];
    propsToFilter.forEach((p) => delete filtered[p]);
    return filtered;
  };

  const motionProxy = new Proxy(
    (Component: React.ElementType, props: Record<string, unknown>) => {
      const { children, ...rest } = props;
      return React.createElement(
        Component,
        { ...filterProps(rest) } as any,
        children as React.ReactNode
      );
    },
    {
      get: (_target, tag: string) => {
        if (
          [
            'div',
            'span',
            'button',
            'a',
            'ul',
            'li',
            'section',
            'header',
            'footer',
            'nav',
            'main',
          ].includes(tag)
        ) {
          return React.forwardRef(
            (
              {
                children,
                ...props
              }: { children?: React.ReactNode; [key: string]: any },
              ref: React.Ref<any>
            ) => {
              return React.createElement(
                tag,
                { ...filterProps(props), ref },
                children
              );
            }
          );
        }
        return actual.motion[tag];
      },
    }
  );

  return {
    ...actual,
    motion: motionProxy,
    AnimatePresence: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
  };
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// Mock HTMLAnchorElement.prototype.click to prevent JSDOM "Not implemented: navigation" error
if (typeof window !== 'undefined') {
  window.HTMLAnchorElement.prototype.click = vi.fn();
}
