import React, { useState, useEffect } from 'react';
import {
  Dialog,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  DialogContent,
  TextField,
  Box,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Close, Add } from '@mui/icons-material';
import { Coin } from 'qapp-core';
import { useTranslation } from 'react-i18next';
import { Transition } from '../../styles/page-styles';
import { AddressBookEntry } from '../../utils/Types';
import {
  getAddressBook,
  searchAddresses,
  deleteAddress,
  addAddress,
  updateAddress,
} from '../../utils/addressBookStorage';
import { AddressBookTable } from './AddressBookTable';
import { AddressFormDialog } from './AddressFormDialog';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

interface AddressBookDialogProps {
  open: boolean;
  onClose: () => void;
  coinType: Coin;
  onSelectAddress?: (address: string, name: string) => void;
}

export const AddressBookDialog: React.FC<AddressBookDialogProps> = ({
  open,
  onClose,
  coinType,
  onSelectAddress,
}) => {
  const { t } = useTranslation(['core']);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [entries, setEntries] = useState<AddressBookEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AddressBookEntry | undefined>(undefined);
  const [deletingEntry, setDeletingEntry] = useState<AddressBookEntry | undefined>(undefined);

  // Load entries when dialog opens or coinType changes
  useEffect(() => {
    if (open) {
      loadEntries();
    }
  }, [open, coinType]);

  // Filter entries when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = searchAddresses(coinType, searchQuery);
      setEntries(filtered);
    } else {
      loadEntries();
    }
  }, [searchQuery, coinType]);

  const loadEntries = () => {
    const allEntries = getAddressBook(coinType);
    setEntries(allEntries);
  };

  const handleAddNew = () => {
    setEditingEntry(undefined);
    setOpenForm(true);
  };

  const handleEdit = (entry: AddressBookEntry) => {
    setEditingEntry(entry);
    setOpenForm(true);
  };

  const handleDeleteClick = (entry: AddressBookEntry) => {
    setDeletingEntry(entry);
    setOpenDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingEntry) {
      deleteAddress(deletingEntry.id, coinType);
      loadEntries();
      setOpenDeleteConfirm(false);
      setDeletingEntry(undefined);
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteConfirm(false);
    setDeletingEntry(undefined);
  };

  const handleSave = (entry: Omit<AddressBookEntry, 'id' | 'createdAt'>) => {
    try {
      if (editingEntry) {
        // Update existing entry
        updateAddress(editingEntry.id, coinType, {
          name: entry.name,
          address: entry.address,
          note: entry.note,
        });
      } else {
        // Add new entry
        addAddress(entry);
      }
      loadEntries();
      setOpenForm(false);
      setEditingEntry(undefined);
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setEditingEntry(undefined);
  };

  const handleUse = (entry: AddressBookEntry) => {
    if (onSelectAddress) {
      console.log(`Address Book: Using address ${entry.name} for ${coinType}`);
      onSelectAddress(entry.address, entry.name);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <>
      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={onClose}
        slots={{ transition: Transition }}
        maxWidth="md"
        fullWidth
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              {t('core:address_book_title', {
                coinType: coinType,
                postProcess: 'capitalizeFirstChar',
              })}
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={onClose}
              aria-label={t('core:close', { postProcess: 'capitalizeFirstChar' })}
            >
              <Close />
            </IconButton>
          </Toolbar>
        </AppBar>

        <DialogContent>
          <Box sx={{ p: 2 }}>
            {/* Search Field */}
            <TextField
              fullWidth
              label={t('core:address_book_search', {
                postProcess: 'capitalizeFirstChar',
              })}
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{ mb: 3 }}
            />

            {/* Add New Button */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddNew}
                sx={{
                  backgroundColor: '#05a2e4',
                  '&:hover': {
                    backgroundColor: '#02648d',
                  },
                }}
              >
                {t('core:address_book_add_new', {
                  postProcess: 'capitalizeFirstChar',
                })}
              </Button>
            </Box>

            {/* Address List */}
            {entries.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '200px',
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  {t('core:address_book_empty', {
                    postProcess: 'capitalizeFirstChar',
                  })}
                </Typography>
              </Box>
            ) : (
              <AddressBookTable
                entries={entries}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onUse={onSelectAddress ? handleUse : undefined}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Form Dialog */}
      <AddressFormDialog
        open={openForm}
        onClose={handleFormClose}
        coinType={coinType}
        entry={editingEntry}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={openDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        entryName={deletingEntry?.name || ''}
      />
    </>
  );
};
