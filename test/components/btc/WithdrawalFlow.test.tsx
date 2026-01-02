/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WithdrawalFlow } from '@/components/btc/WithdrawalFlow';

global.fetch = vi.fn();

describe('WithdrawalFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render WBTC amount and BTC address inputs', () => {
    render(<WithdrawalFlow />);

    expect(screen.getByLabelText(/WBTC Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/BTC Address/i)).toBeInTheDocument();
  });

  it('should validate BTC address on input', async () => {
    render(<WithdrawalFlow />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/BTC Address/i), 'invalid');
    await user.tab(); // blur

    await waitFor(() => {
      expect(screen.getByText(/Invalid BTC address/i)).toBeInTheDocument();
    });
  });

  it('should accept valid BTC address', async () => {
    render(<WithdrawalFlow />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/BTC Address/i), 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');
    await user.tab();

    await waitFor(() => {
      expect(screen.queryByText(/Invalid/i)).not.toBeInTheDocument();
    });
  });

  it('should show quote after entering details', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        withdrawalId: 'wd-123',
        expectedOutput: '0.495',
        approvalRequired: true,
      }),
    } as Response);

    render(<WithdrawalFlow />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/WBTC Amount/i), '0.5');
    await user.type(screen.getByLabelText(/BTC Address/i), 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');
    await user.click(screen.getByRole('button', { name: /Get Quote/i }));

    await waitFor(() => {
      expect(screen.getByText(/Expected BTC/i)).toBeInTheDocument();
      expect(screen.getByText(/0.495/)).toBeInTheDocument();
    });
  });

  it('should show approval step if needed', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        withdrawalId: 'wd-123',
        expectedOutput: '0.495',
        approvalRequired: true,
        approvalTx: { to: '0x...', data: '0x...' },
      }),
    } as Response);

    render(<WithdrawalFlow />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/WBTC Amount/i), '0.5');
    await user.type(screen.getByLabelText(/BTC Address/i), 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');
    await user.click(screen.getByRole('button', { name: /Get Quote/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Approve WBTC/i })).toBeInTheDocument();
    });
  });

  it('should disable submit when balance insufficient', async () => {
    render(<WithdrawalFlow wbtcBalance="0.1" />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/WBTC Amount/i), '0.5');

    await waitFor(() => {
      expect(screen.getByText(/Insufficient balance/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Get Quote/i })).toBeDisabled();
    });
  });
});
