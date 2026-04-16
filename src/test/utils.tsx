import React from 'react';
import { render, renderHook } from '@testing-library/react';
import type { RenderOptions, RenderHookOptions } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

interface ProvidersOptions {
  /**
   * Initial URL for the router. If omitted the router starts at "/".
   * Example: '/view/abc-token'
   */
  route?: string;
  /**
   * Route pattern to match when rendering a component that reads URL params.
   * Requires `route` to be set as well.
   * Example: '/view/:shareToken'
   */
  path?: string;
}

function Providers({
  children,
  route = '/',
  path,
}: ProvidersOptions & { children: React.ReactNode }) {
  if (path) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={<>{children}</>} />
        </Routes>
      </MemoryRouter>
    );
  }
  return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
}

/**
 * Renders a component wrapped in the common test providers (router).
 * Use this instead of bare `render()` for any component that calls
 * `useNavigate`, `useParams`, `useLocation`, or renders `<Link>`.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: ProvidersOptions & Omit<RenderOptions, 'wrapper'>
) {
  const { route, path, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <Providers route={route} path={path}>
        {children}
      </Providers>
    ),
    ...renderOptions,
  });
}

/**
 * renderHook variant with the same providers.
 */
export function renderHookWithProviders<T>(
  hook: () => T,
  options?: ProvidersOptions & Omit<RenderHookOptions<T>, 'wrapper'>
) {
  const { route, path, ...hookOptions } = options ?? {};
  return renderHook(hook, {
    wrapper: ({ children }) => (
      <Providers route={route} path={path}>
        {children}
      </Providers>
    ),
    ...hookOptions,
  });
}

export * from '@testing-library/react';
