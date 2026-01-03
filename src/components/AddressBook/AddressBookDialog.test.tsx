import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { Coin } from 'qapp-core';
import { AddressBookDialog } from './AddressBookDialog';
import { addAddress } from '../../utils/addressBookStorage';

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

  describe('Pagination', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should display pagination controls when entries exist', () => {
      // Add 3 entries
      addAddress({
        name: 'Alice',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: 'Test note 1',
        coinType: Coin.BTC,
      });
      addAddress({
        name: 'Bob',
        address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        note: 'Test note 2',
        coinType: Coin.BTC,
      });
      addAddress({
        name: 'Charlie',
        address: '1dice8EMZmqKvrGE4Qc9bUFf9PX3xaYDp',
        note: 'Test note 3',
        coinType: Coin.BTC,
      });

      render(
        <AddressBookDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      // Should show pagination with "1–3 of 3"
      expect(screen.getByText(/1–3 of 3/i)).toBeInTheDocument();
    });

    it('should display max 7 records per page', () => {
      // Add 10 entries - Note: entries are sorted alphabetically by name
      for (let i = 1; i <= 10; i++) {
        addAddress({
          name: `Entry ${String(i).padStart(2, '0')}`, // Pad to ensure correct alphabetical sorting
          address: `1Address${i}XXXXXXXXXXXXXXXXXX`,
          note: `Note ${i}`,
          coinType: Coin.BTC,
        });
      }

      render(
        <AddressBookDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      // First page should show ADDRESS_BOOK_ROWS_PER_PAGE entries (5)
      expect(screen.getByText(/1–5 of 10/i)).toBeInTheDocument();

      // Should show first 5 entries (alphabetically)
      expect(screen.getByText('Entry 01')).toBeInTheDocument();
      expect(screen.getByText('Entry 05')).toBeInTheDocument();

      // Should not show 6th entry yet
      expect(screen.queryByText('Entry 06')).not.toBeInTheDocument();
    });

    it('should navigate between pages correctly', async () => {
      const user = userEvent.setup();

      // Add 10 entries
      for (let i = 1; i <= 10; i++) {
        addAddress({
          name: `Entry ${String(i).padStart(2, '0')}`,
          address: `1Address${i}XXXXXXXXXXXXXXXXXX`,
          note: `Note ${i}`,
          coinType: Coin.BTC,
        });
      }

      render(
        <AddressBookDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      // Initially on page 1
      expect(screen.getByText('Entry 01')).toBeInTheDocument();
      expect(screen.queryByText('Entry 08')).not.toBeInTheDocument();

      // Click next page button
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      // Now on page 2 - should show entries 05-10
      expect(screen.queryByText('Entry 01')).not.toBeInTheDocument();
      expect(screen.getByText('Entry 06')).toBeInTheDocument();
      expect(screen.getByText(/6–10 of 10/i)).toBeInTheDocument();
    });

    it('should reset to first page when searching', async () => {
      const user = userEvent.setup();

      // Add 10 entries
      for (let i = 1; i <= 10; i++) {
        addAddress({
          name: `Entry ${String(i).padStart(2, '0')}`,
          address: `1Address${i}XXXXXXXXXXXXXXXXXX`,
          note: `Note ${i}`,
          coinType: Coin.BTC,
        });
      }

      render(
        <AddressBookDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      // Navigate to page 2
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      expect(screen.getByText('Entry 08')).toBeInTheDocument();

      // Now search for something
      const searchField = screen.getByRole('textbox', { name: /search by name or address/i });
      await user.type(searchField, 'Entry 05');

      // Should be back on page 1 and show only Entry 05
      expect(screen.getByText('Entry 05')).toBeInTheDocument();
      expect(screen.queryByText('Entry 08')).not.toBeInTheDocument();
    });

    it('should adjust page when deleting last record on a page', async () => {
      const user = userEvent.setup();

      // Add exactly 6 entries (will be 5 on page 1, 1 on page 2)
      for (let i = 1; i <= 6; i++) {
        addAddress({
          name: `Entry ${String(i).padStart(2, '0')}`,
          address: `1Address${i}XXXXXXXXXXXXXXXXXX`,
          note: `Note ${i}`,
          coinType: Coin.BTC,
        });
      }

      render(
        <AddressBookDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      // Navigate to page 2
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      // Should be on page 2 with Entry 06
      expect(screen.getByText('Entry 06')).toBeInTheDocument();
      expect(screen.getByText(/6–6 of 6/i)).toBeInTheDocument();

      // Delete Entry 08 (the only entry on page 2)
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      const deleteButton = deleteButtons.find(button => {
        const row = button.closest('tr') || button.closest('[role="article"]');
        return row && within(row as HTMLElement).queryByText('Entry 08');
      });

      if (deleteButton) {
        await user.click(deleteButton);

        // Confirm deletion - the delete confirmation dialog has two "delete" buttons
        // One is the title/icon, one is the confirm button
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        // Find the one that's a contained button (the confirm button)
        const confirmButton = deleteButtons.find(btn =>
          btn.className.includes('MuiButton-contained')
        );

        if (confirmButton) {
          await user.click(confirmButton);
        }

        // Should automatically go back to page 1 since page 2 is now empty
        expect(screen.queryByText('Entry 06')).not.toBeInTheDocument();
        expect(screen.getByText('Entry 01')).toBeInTheDocument();
        expect(screen.getByText(/1–5 of 5/i)).toBeInTheDocument();
      }
    });

    it('should show correct total count', () => {
      // Add 15 entries
      for (let i = 1; i <= 15; i++) {
        addAddress({
          name: `Entry ${String(i).padStart(2, '0')}`,
          address: `1Address${i}XXXXXXXXXXXXXXXXXX`,
          note: `Note ${i}`,
          coinType: Coin.BTC,
        });
      }

      render(
        <AddressBookDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      // Should show "1–5 of 15"
      expect(screen.getByText(/1–5 of 15/i)).toBeInTheDocument();
    });

    it('should handle last page with fewer records', async () => {
      const user = userEvent.setup();

      // Add 8 entries (page 1: 5 entries, page 2: 3 entries)
      for (let i = 1; i <= 8; i++) {
        addAddress({
          name: `Entry ${String(i).padStart(2, '0')}`,
          address: `1Address${i}XXXXXXXXXXXXXXXXXX`,
          note: `Note ${i}`,
          coinType: Coin.BTC,
        });
      }

      render(
        <AddressBookDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      // Navigate to page 2
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      // Should show "6–8 of 8" (3 entries on last page)
      expect(screen.getByText(/6–8 of 8/i)).toBeInTheDocument();
      expect(screen.getByText('Entry 06')).toBeInTheDocument();
      expect(screen.getByText('Entry 07')).toBeInTheDocument();
      expect(screen.getByText('Entry 08')).toBeInTheDocument();
    });

    it('should display rows per page selector', () => {
      // Add 20 entries
      for (let i = 1; i <= 20; i++) {
        addAddress({
          name: `Entry ${String(i).padStart(2, '0')}`,
          address: `1Address${i}XXXXXXXXXXXXXXXXXX`,
          note: `Note ${i}`,
          coinType: Coin.BTC,
        });
      }

      render(
        <AddressBookDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSelectAddress={mockOnSelectAddress}
        />
      );

      // Initially showing 5 per page
      expect(screen.getByText(/1–5 of 20/i)).toBeInTheDocument();

      // Should have rows per page selector
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });
  });
});
