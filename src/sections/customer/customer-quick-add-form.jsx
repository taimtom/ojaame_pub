import { useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { addCustomer } from 'src/actions/customer';
import { useOnboardingProgress } from 'src/actions/onboarding';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { useAdvanceOnboarding, useOnboardingMode } from 'src/hooks/use-onboarding-mode';
import { isContactPickerSupported, pickContactsFromDevice } from 'src/utils/contact-picker';

// ----------------------------------------------------------------------

const EMPTY_FORM = { name: '', phone: '' };

function buildCustomerPayload(name, phone, storeId) {
  return {
    name: name.trim(),
    phone_number: phone.trim(),
    address: 'N/A',
    city: 'N/A',
    state: 'N/A',
    country: 'Nigeria',
    zip_code: '000000',
    primary: 1,
    address_type: 'Home',
    store_id: Number(storeId),
  };
}

function getStoreIdFromStorage(fallbackStoreId) {
  if (fallbackStoreId) return fallbackStoreId;
  try {
    const raw = localStorage.getItem('activeWorkspace');
    if (raw) {
      const ws = JSON.parse(raw);
      if (ws?.id) return ws.id;
    }
  } catch {
    /* ignore */
  }
  const stored = localStorage.getItem('store_id');
  return stored ? Number(stored) : null;
}

// ----------------------------------------------------------------------

export function CustomerQuickAddForm({ storeId: storeIdProp }) {
  const onboarding = useOnboardingMode();
  const advanceOnboarding = useAdvanceOnboarding();
  const { mutateProgress } = useOnboardingProgress({ skip: !onboarding });

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [pickingContacts, setPickingContacts] = useState(false);
  const [importingContacts, setImportingContacts] = useState(false);
  const [pickedContacts, setPickedContacts] = useState([]);
  const [addedCount, setAddedCount] = useState(0);

  const canPickContacts = isContactPickerSupported();

  const handlePickContacts = async () => {
    if (!canPickContacts) {
      toast.info('Contact picker is not supported on this device/browser. Enter details manually.');
      return;
    }
    try {
      setPickingContacts(true);
      const contacts = await pickContactsFromDevice({ multiple: true });
      if (!contacts.length) return;

      setPickedContacts((prev) => {
        const seen = new Set(prev.map((c) => `${c.name}|${c.phone}`));
        const merged = [...prev];
        contacts.forEach((contact) => {
          const key = `${contact.name}|${contact.phone}`;
          if (!seen.has(key) && (contact.name || contact.phone)) {
            seen.add(key);
            merged.push(contact);
          }
        });
        return merged;
      });
      toast.success(`Selected ${contacts.length} contact${contacts.length === 1 ? '' : 's'}.`);
    } catch (error) {
      if (error?.name === 'AbortError' || error?.message === 'unsupported') return;
      toast.error('Could not read contacts from this device.');
    } finally {
      setPickingContacts(false);
    }
  };

  const removePickedContact = (index) => {
    setPickedContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImportPickedContacts = async () => {
    const storeId = getStoreIdFromStorage(storeIdProp);
    if (!storeId) {
      toast.error('No active store found');
      return;
    }
    const valid = pickedContacts.filter((c) => c.name?.trim() && c.phone?.trim());
    if (!valid.length) {
      toast.error('Selected contacts need both a name and phone number.');
      return;
    }

    setImportingContacts(true);
    let success = 0;
    let failed = 0;

    try {
      for (const contact of valid) {
        try {
          await addCustomer(buildCustomerPayload(contact.name, contact.phone, storeId));
          success += 1;
        } catch {
          failed += 1;
        }
      }

      if (success > 0) {
        setAddedCount((prev) => prev + success);
        if (onboarding) await mutateProgress();
        toast.success(`Imported ${success} customer${success === 1 ? '' : 's'}.`);
      }
      if (failed > 0) {
        toast.error(`${failed} contact${failed === 1 ? '' : 's'} could not be imported.`);
      }
      if (success > 0) {
        setPickedContacts([]);
      }
    } finally {
      setImportingContacts(false);
    }
  };

  const handleAddOne = async (andAddAnother = false) => {
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (!name || !phone) {
      toast.error('Enter both customer name and phone number.');
      return;
    }

    const storeId = getStoreIdFromStorage(storeIdProp);
    if (!storeId) {
      toast.error('No active store found');
      return;
    }

    setSubmitting(true);
    try {
      await addCustomer(buildCustomerPayload(name, phone, storeId));
      toast.success(`"${name}" added!`);
      setAddedCount((prev) => prev + 1);
      if (onboarding) await mutateProgress();
      if (andAddAnother) {
        setForm(EMPTY_FORM);
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to add customer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Quick add customer
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add customers one at a time, or import several from your phone contacts at once.
          </Typography>
        </Box>

        {canPickContacts && (
          <Stack spacing={2}>
            <Button
              variant="outlined"
              startIcon={
                pickingContacts ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <Iconify icon="solar:users-group-rounded-bold" />
                )
              }
              disabled={pickingContacts || importingContacts}
              onClick={handlePickContacts}
            >
              {pickingContacts ? 'Opening contacts...' : 'Import from phone contacts'}
            </Button>

            {pickedContacts.length > 0 && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  border: '1px dashed',
                  borderColor: 'divider',
                }}
              >
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2">
                    {pickedContacts.length} contact{pickedContacts.length === 1 ? '' : 's'} ready to
                    import
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {pickedContacts.map((contact, index) => (
                      <Chip
                        key={`${contact.name}-${contact.phone}-${index}`}
                        label={`${contact.name || 'No name'} · ${contact.phone || 'No phone'}`}
                        onDelete={() => removePickedContact(index)}
                        size="small"
                      />
                    ))}
                  </Stack>
                  <Button
                    variant="contained"
                    disabled={importingContacts}
                    onClick={handleImportPickedContacts}
                    startIcon={
                      importingContacts ? <CircularProgress size={18} color="inherit" /> : null
                    }
                  >
                    {importingContacts
                      ? 'Importing...'
                      : `Import ${pickedContacts.length} contact${pickedContacts.length === 1 ? '' : 's'}`}
                  </Button>
                </Stack>
              </Box>
            )}
          </Stack>
        )}

        {!canPickContacts && (
          <Alert severity="info" icon={false}>
            Contact import works on supported mobile browsers. You can still add customers manually
            below.
          </Alert>
        )}

        <Divider>or add manually</Divider>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Full name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Phone number"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            fullWidth
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="contained"
            size="large"
            disabled={submitting}
            onClick={() => handleAddOne(false)}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
            sx={{ flex: 1 }}
          >
            {submitting ? 'Adding...' : 'Add customer'}
          </Button>
          <Button
            variant="outlined"
            size="large"
            disabled={submitting}
            onClick={() => handleAddOne(true)}
            sx={{ flex: 1 }}
          >
            Add &amp; add another
          </Button>
          {onboarding && addedCount > 0 && (
            <Button
              variant="contained"
              color="success"
              size="large"
              disabled={submitting || importingContacts}
              onClick={() => advanceOnboarding()}
              sx={{ flex: 1 }}
            >
              Continue setup
            </Button>
          )}
        </Stack>

        {addedCount > 0 && (
          <Typography variant="caption" color="text.secondary" textAlign="center">
            {addedCount} customer{addedCount === 1 ? '' : 's'} added this session
          </Typography>
        )}
      </Stack>
    </Card>
  );
}
