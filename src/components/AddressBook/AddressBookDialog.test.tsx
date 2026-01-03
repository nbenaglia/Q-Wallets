import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { Coin } from 'qapp-core';
import { AddressBookDialog } from './AddressBookDialog';

describe('AddressBookDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSelectAddress = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('should render with correct title', () => {
      render(
        <AddressBookDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      expect(screen.getByText(/address book - BTC/i)).toBeInTheDocument();
    });

    it('should show empty state when no addresses', () => {
      render(
        <AddressBookDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      expect(screen.getByText(/no addresses saved yet/i)).toBeInTheDocument();
    });

    it('should display search field', () => {
      render(
        <AddressBookDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      expect(screen.getByRole('textbox', { name: /search by name or address/i })).toBeInTheDocument();
    });

    it('should show add new button', () => {
      render(
        <AddressBookDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      expect(screen.getByRole('button', { name: /add new address/i })).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      const { container } = render(
        <AddressBookDialog
          open={false}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });
  });

  describe('Add Address', () => {
    it('should open form dialog on "Add New" click', async () => {
      const user = userEvent.setup();

      render(
        <AddressBookDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      const addButton = screen.getByRole('button', { name: /add new address/i });
      await user.click(addButton);

      // Form dialog should be visible - check for save/cancel buttons
      expect(screen.getAllByRole('button', { name: /save/i })).toHaveLength(1);
      expect(screen.getAllByRole('button', { name: /cancel/i })).toHaveLength(1);
    });
  });

  describe('Close functionality', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();

      render(
        <AddressBookDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
