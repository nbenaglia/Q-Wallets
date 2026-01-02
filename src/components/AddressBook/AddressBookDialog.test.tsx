import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { Coin } from 'qapp-core';
import * as storage from '../../utils/addressBookStorage';
import { AddressBookDialog } from './AddressBookDialog';

// Mock the storage module
vi.mock('../../../utils/addressBookStorage', () => ({
  getAddressBook: vi.fn(() => []),
  searchAddresses: vi.fn(() => []),
  addAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
}));

describe('AddressBookDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSelectAddress = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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

      expect(screen.getByLabelText(/search by name or address/i)).toBeInTheDocument();
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

  describe('Search/Filter', () => {
    it('should call searchAddresses when typing in search field', async () => {
      const user = userEvent.setup();
      const mockSearch = vi.mocked(storage.searchAddresses);

      render(
        <AddressBookDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      const searchInput = screen.getByLabelText(/search by name or address/i);
      await user.type(searchInput, 'alice');

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalledWith(Coin.BTC, 'alice');
      });
    });

    it('should call getAddressBook for empty search', async () => {
      const user = userEvent.setup();
      const mockGetAddressBook = vi.mocked(storage.getAddressBook);

      render(
        <AddressBookDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      const searchInput = screen.getByLabelText(/search by name or address/i);
      await user.type(searchInput, 'test');
      await user.clear(searchInput);

      await waitFor(() => {
        expect(mockGetAddressBook).toHaveBeenCalled();
      });
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

      // Form dialog should be visible
      expect(screen.getByRole('dialog', { name: /add new address/i })).toBeInTheDocument();
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

  describe('Display addresses', () => {
    it('should display addresses from storage', () => {
      const mockAddresses = [
        {
          id: '1',
          name: 'Test Wallet',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          note: 'My test wallet',
          coinType: 'BTC',
          createdAt: Date.now(),
        },
      ];

      vi.mocked(storage.getAddressBook).mockReturnValue(mockAddresses);

      render(
        <AddressBookDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      expect(screen.getByText('Test Wallet')).toBeInTheDocument();
      expect(screen.getByText(/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa/)).toBeInTheDocument();
    });
  });
});
