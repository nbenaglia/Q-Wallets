import React, { useState, useEffect } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material';
import { Coin } from 'qapp-core';
import { useTranslation } from 'react-i18next';
import { DialogGeneral } from '../../styles/page-styles';
import { AddressBookEntry } from '../../utils/Types';
import { validateAddress } from '../../utils/addressValidation';

interface AddressFormDialogProps {
  open: boolean;
  onClose: () => void;
  coinType: Coin;
  entry?: AddressBookEntry;
  onSave: (entry: Omit<AddressBookEntry, 'id' | 'createdAt'>) => void;
}

export const AddressFormDialog: React.FC<AddressFormDialogProps> = ({
  open,
  onClose,
  coinType,
  entry,
  onSave,
}) => {
  const { t } = useTranslation(['core']);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [noteError, setNoteError] = useState('');

  const isEditMode = !!entry;

  // Load entry data when editing
  useEffect(() => {
    if (open) {
      if (entry) {
        setName(entry.name);
        setAddress(entry.address);
        setNote(entry.note);
      } else {
        // Reset form for new entry
        setName('');
        setAddress('');
        setNote('');
      }
      // Clear errors when dialog opens
      setNameError('');
      setAddressError('');
      setNoteError('');
    }
  }, [open, entry]);

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setNameError(
        t('core:address_book_name_required', {
          postProcess: 'capitalizeFirstChar',
        })
      );
      return false;
    }
    if (value.length > 50) {
      setNameError(
        t('core:address_book_name_max_length', {
          postProcess: 'capitalizeFirstChar',
        })
      );
      return false;
    }
    setNameError('');
    return true;
  };

  const validateAddressField = (value: string): boolean => {
    if (!value.trim()) {
      setAddressError(
        t('core:address_book_address_required', {
          postProcess: 'capitalizeFirstChar',
        })
      );
      return false;
    }
    if (!validateAddress(coinType, value)) {
      setAddressError(
        t('core:address_book_address_invalid', {
          coinType: coinType,
          postProcess: 'capitalizeFirstChar',
        })
      );
      return false;
    }
    setAddressError('');
    return true;
  };

  const validateNote = (value: string): boolean => {
    if (value.length > 200) {
      setNoteError(
        t('core:address_book_note_max_length', {
          postProcess: 'capitalizeFirstChar',
        })
      );
      return false;
    }
    setNoteError('');
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    validateName(value);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setAddress(value);
    validateAddressField(value);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNote(value);
    validateNote(value);
  };

  const handleSave = () => {
    // Validate all fields
    const isNameValid = validateName(name);
    const isAddressValid = validateAddressField(address);
    const isNoteValid = validateNote(note);

    if (isNameValid && isAddressValid && isNoteValid) {
      onSave({
        name: name.trim(),
        address: address.trim(),
        note: note.trim(),
        coinType,
      });
    }
  };

  const isFormValid =
    name.trim() !== '' &&
    address.trim() !== '' &&
    !nameError &&
    !addressError &&
    !noteError;

  return (
    <DialogGeneral open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditMode
          ? t('core:address_book_edit', {
              postProcess: 'capitalizeFirstChar',
            })
          : t('core:address_book_add_new', {
              postProcess: 'capitalizeFirstChar',
            })}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Name Field */}
          <TextField
            required
            fullWidth
            label={t('core:address_book_name', {
              postProcess: 'capitalizeFirstChar',
            })}
            value={name}
            onChange={handleNameChange}
            error={!!nameError}
            helperText={
              nameError || (
                <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span></span>
                  <span style={{ fontSize: '0.75rem' }}>
                    {name.length}/50
                  </span>
                </Box>
              )
            }
            inputProps={{
              maxLength: 50,
            }}
          />

          {/* Address Field */}
          <TextField
            required
            fullWidth
            label={t('core:address_book_address', {
              postProcess: 'capitalizeFirstChar',
            })}
            value={address}
            onChange={handleAddressChange}
            error={!!addressError}
            helperText={addressError}
          />

          {/* Note Field */}
          <TextField
            fullWidth
            label={t('core:address_book_note', {
              postProcess: 'capitalizeFirstChar',
            })}
            value={note}
            onChange={handleNoteChange}
            error={!!noteError}
            helperText={
              noteError || (
                <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span></span>
                  <span style={{ fontSize: '0.75rem' }}>
                    {note.length}/200
                  </span>
                </Box>
              )
            }
            multiline
            rows={3}
            inputProps={{
              maxLength: 200,
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>
          {t('core:address_book_cancel', {
            postProcess: 'capitalizeFirstChar',
          })}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!isFormValid}
          sx={{
            backgroundColor: '#05a2e4',
            '&:hover': {
              backgroundColor: '#02648d',
            },
            '&:disabled': {
              backgroundColor: 'rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          {t('core:address_book_save', {
            postProcess: 'capitalizeFirstChar',
          })}
        </Button>
      </DialogActions>
    </DialogGeneral>
  );
};
