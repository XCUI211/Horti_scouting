import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import RijsenhoutMap from './Rijsenhout';
import { AuthProvider } from '../../context/AuthContext';
import '../../translator';

const renderMap = (ui = <RijsenhoutMap />) =>
  render(<AuthProvider>{ui}</AuthProvider>);

const mockReports = (data) => {
  globalThis.fetch = vi.fn().mockResolvedValue({  // fix for npm run lint
    json: () => Promise.resolve({ status: 'success', data }),
  });
};

const findCell = (container, label) =>
  [...container.querySelectorAll('.grid-cell')].find(
    (c) => c.textContent.trim() === label
  );

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Rijsenhout cell coloring', () => {
  it('paints an approved + pests_found cell with status-approved', async () => {
    mockReports([
      { cell_name: 'baan 1', status: 'approved', pests_found: true, block_key: null },
    ]);

    const { container } = renderMap();

    await waitFor(() => {
      expect(findCell(container, 'baan 1').className).toContain('status-approved');
    });
  });

  it('paints a pending cell with status-pending', async () => {
    mockReports([
      { cell_name: 'baan 1', status: 'pending', pests_found: true, block_key: null },
    ]);

    const { container } = renderMap();

    await waitFor(() => {
      expect(findCell(container, 'baan 1').className).toContain('status-pending');
    });
  });

  it('leaves an approved + no pests cell without a status class', async () => {
    mockReports([
      { cell_name: 'baan 1', status: 'approved', pests_found: false, block_key: null },
    ]);

    const { container } = renderMap();

    await waitFor(() => {
      const cls = findCell(container, 'baan 1').className;
      expect(cls).not.toContain('status-approved');
      expect(cls).not.toContain('status-pending');
    });
  });

  it('lets the latest pending report supersede an older approved + pests', async () => {
    mockReports([
      { cell_name: 'baan 1', status: 'pending',  pests_found: false, block_key: null },
      { cell_name: 'baan 1', status: 'approved', pests_found: true,  block_key: null },
    ]);

    const { container } = renderMap();

    await waitFor(() => {
      expect(findCell(container, 'baan 1').className).toContain('status-pending');
    });
  });

  it('skips rejected reports and falls through to the next-latest', async () => {
    mockReports([
      { cell_name: 'baan 1', status: 'rejected', pests_found: true, block_key: null },
      { cell_name: 'baan 1', status: 'approved', pests_found: true, block_key: null },
    ]);

    const { container } = renderMap();

    await waitFor(() => {
      expect(findCell(container, 'baan 1').className).toContain('status-approved');
    });
  });

  it('does not color cells that have no reports', async () => {
    mockReports([
      { cell_name: 'baan 1', status: 'approved', pests_found: true, block_key: null },
    ]);

    const { container } = renderMap();

    await waitFor(() => {
      const cls = findCell(container, 'baan 2').className;
      expect(cls).not.toContain('status-approved');
      expect(cls).not.toContain('status-pending');
    });
  });
});
