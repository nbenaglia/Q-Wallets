import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { Coin } from 'qapp-core';
import { AddressFormDialog } from './AddressFormDialog';

describe('AddressFormDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering - Add Mode', () => {
    it('should show "add new address" title when no entry provided', () => {
      render(
        <AddressFormDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText(/add new address/i)).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(
        <AddressFormDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/note/i)).toBeInTheDocument();
    });

    it('should show save and cancel buttons', () => {
      render(
        <AddressFormDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Rendering - Edit Mode', () => {
    it('should show "edit" title when entry provided', () => {
      const entry = {
        id: '1',
        name: 'Test Wallet',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: 'My test wallet',
        coinType: 'BTC',
        createdAt: Date.now(),
      };

      render(
        <AddressFormDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          entry={entry}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText(/edit/i)).toBeInTheDocument();
    });

    it('should populate fields with entry data', () => {
      const entry = {
        id: '1',
        name: 'Test Wallet',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: 'My test wallet',
        coinType: 'BTC',
        createdAt: Date.now(),
      };

      render(
        <AddressFormDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          entry={entry}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByDisplayValue('Test Wallet')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBeInTheDocument();
      expect(screen.getByDisplayValue('My test wallet')).toBeInTheDocument();
    });
  });

  describe('Validation - Name Field', () => {
    it('should show error for empty name', async () => {
      const user = userEvent.setup();

      render(
        <AddressFormDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.click(nameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for name exceeding 50 characters', async () => {
      const user = userEvent.setup();

      render(
        <AddressFormDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      const longName = 'a'.repeat(51);
      await user.type(nameInput, longName);

      await waitFor(() => {
        expect(screen.getByText(/name must be 50 characters or less/i)).toBeInTheDocument();
      });
    });

    it('should display character counter for name', async () => {
      const user = userEvent.setup();

      render(
        <AddressFormDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test');

      expect(screen.getByText(/4\/50/)).toBeInTheDocument();
    });
  });

  describe('Validation - Address Field', () => {
    it('should show error for empty address', async () => {
      const user = userEvent.setup();

      render(
        <AddressFormDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSave={mockOnSave}
        />
      );

      const addressInput = screen.getByLabelText(/address/i);
      await user.click(addressInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/address is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid BTC address format', async () => {
      const user = userEvent.setup();

      render(
        <AddressFormDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSave={mockOnSave}
        />
      );

      const addressInput = screen.getByLabelText(/address/i);
      await user.type(addressInput, 'invalid-address');

      await waitFor(() => {
        expect(screen.getByText(/invalid BTC address format/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validation - Note Field', () => {
    it('should show error for note exceeding 200 characters', async () => {
      const user = userEvent.setup();

      render(
        <AddressFormDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSave={mockOnSave}
        />
      );

      const noteInput = screen.getByLabelText(/note/i);
      const longNote = 'a'.repeat(201);
      await user.type(noteInput, longNote);

      await waitFor(() => {
        expect(screen.getByText(/note must be 200 characters or less/i)).toBeInTheDocument();
      });
    });

    it('should display character counter for note', async () => {
      const user = userEvent.setup();

      render(
        <AddressFormDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSave={mockOnSave}
        />
      );

      const noteInput = screen.getByLabelText(/note/i);
      await user.type(noteInput, 'Test note');

      expect(screen.getByText(/9\/200/)).toBeInTheDocument();
    });
  });

  describe('Save Button State', () => {
    it('should disable save button when form is invalid', () => {
      render(
        <AddressFormDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when form is valid', async () => {
      const user = userEvent.setup();

      render(
        <AddressFormDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      const addressInput = screen.getByLabelText(/address/i);

      await user.type(nameInput, 'Test Wallet');
      await user.type(addressInput, '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save/i });
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('Save functionality', () => {
    it('should call onSave with correct data when save button clicked', async () => {
      const user = userEvent.setup();

      render(
        <AddressFormDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      const addressInput = screen.getByLabelText(/address/i);
      const noteInput = screen.getByLabelText(/note/i);

      await user.type(nameInput, 'Test Wallet');
      await user.type(addressInput, '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      await user.type(noteInput, 'My test wallet');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        name: 'Test Wallet',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        note: 'My test wallet',
        coinType: Coin.BTC,
      });
    });

    it('should not call onSave when form is invalid', async () => {
      const user = userEvent.setup();

      render(
        <AddressFormDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Cancel functionality', () => {
    it('should call onClose when cancel button clicked', async () => {
      const user = userEvent.setup();

      render(
        <AddressFormDialog
          open={true}
          onClose={mockOnClose}
          coinType={Coin.BTC}
          onSave={mockOnSave}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
