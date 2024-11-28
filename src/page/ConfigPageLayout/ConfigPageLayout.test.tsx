import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { CompatRouter, Route, Routes } from 'react-router-dom-v5-compat';
import { render } from '@testing-library/react';

import { ROUTES } from 'routing/types';
import { getRoute } from 'routing/utils';

import { DataTestIds } from '../../test/dataTestIds';
import { ConfigPageLayout } from './ConfigPageLayout';

function Wrapper({ initialEntries = ['/'] }) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <CompatRouter>
        <Routes>
          <Route path={getRoute(ROUTES.Config)} Component={ConfigPageLayout}>
            <Route index element={<div data-testid="indexRoute">index</div>} />
            <Route path="access-tokens" element={<div data-testid="indexAccessTokens">access-tokens</div>} />
            <Route path="terraform" element={<div data-testid="terraform">terraform</div>} />
          </Route>
        </Routes>
      </CompatRouter>
    </MemoryRouter>
  );
}

function renderPage(path = '') {
  return render(<Wrapper initialEntries={[getRoute(ROUTES.Config) + path]} />);
}

describe('ConfigPageLayout', () => {
  it.each([
    ['/', 'indexRoute'],
    ['/access-tokens', 'indexAccessTokens'],
    ['/terraform', 'terraform'],
  ])('should render <Outlet /> (path: %s)', (path, testId) => {
    const { getByTestId } = renderPage(path);
    expect(getByTestId(testId)).toBeInTheDocument();
  });

  it.each([
    ['/', 'General'],
    ['/access-tokens', 'Access tokens'],
    ['/terraform', 'Terraform'],
  ])('should show correct active tab (path: %s)', (path, text) => {
    const { getByTestId } = renderPage(path);
    // Test id is generated by the text of the tab
    const activeTab = getByTestId(DataTestIds.CONFIG_PAGE_LAYOUT_ACTIVE_TAB);
    expect(activeTab).toBeInTheDocument();
    expect(activeTab).toHaveTextContent(text);
  });
});
