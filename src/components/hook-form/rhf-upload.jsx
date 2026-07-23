import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import FormHelperText from '@mui/material/FormHelperText';

import { uploadFile } from 'src/actions/upload';
import { toast } from 'src/components/snackbar';

import { Upload, UploadBox, UploadAvatar } from '../upload';

// ----------------------------------------------------------------------

export function RHFUploadAvatar({
  name,
  uploadImmediately = false,
  getUploadName,
  onUploadingChange,
  ...other
}) {
  const { control, setValue, getValues } = useFormContext();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const setBusy = (v) => {
    setUploadingAvatar(v);
    onUploadingChange?.(v);
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const onDrop = async (acceptedFiles) => {
          const file = acceptedFiles[0];
          if (!file) return;

          if (uploadImmediately) {
            setBusy(true);
            try {
              const label =
                getUploadName?.() ??
                getValues('storeName') ??
                getValues('companyName') ??
                'upload';
              const url = await uploadFile(file, label);
              setValue(name, url, { shouldValidate: true, shouldDirty: true });
            } catch (e) {
              toast.error(e?.message || 'Upload failed');
            } finally {
              setBusy(false);
            }
          } else {
            setValue(name, file, { shouldValidate: true });
          }
        };

        return (
          <div>
            <UploadAvatar
              value={field.value}
              error={!!error}
              onDrop={onDrop}
              disabled={other.disabled || uploadingAvatar}
              {...other}
            />

            {!!error && (
              <FormHelperText error sx={{ px: 2, textAlign: 'center' }}>
                {error.message}
              </FormHelperText>
            )}
          </div>
        );
      }}
    />
  );
}

// ----------------------------------------------------------------------

export function RHFUploadBox({ name, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <UploadBox value={field.value} error={!!error} {...other} />
      )}
    />
  );
}

// ----------------------------------------------------------------------

export function RHFUpload({
  name,
  multiple,
  helperText,
  uploadImmediately = false,
  getUploadName,
  onUploadingChange,
  ...other
}) {
  const { control, setValue, getValues } = useFormContext();
  const [uploading, setUploading] = useState(false);

  const setBusy = (v) => {
    setUploading(v);
    onUploadingChange?.(v);
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const uploadProps = {
          multiple,
          accept: { 'image/*': [] },
          error: !!error,
          helperText: error?.message ?? helperText,
          disabled: other.disabled || uploading,
        };

        const onDrop = async (acceptedFiles) => {
          if (multiple) {
            if (uploadImmediately) {
              setBusy(true);
              try {
                const label = getUploadName?.() ?? getValues('name') ?? 'upload';
                const urls = await Promise.all(
                  acceptedFiles.map((file) => uploadFile(file, label))
                );
                const prev = Array.isArray(field.value) ? field.value : [];
                setValue(name, [...prev, ...urls], { shouldValidate: true, shouldDirty: true });
              } catch (e) {
                toast.error(e?.message || 'Upload failed');
              } finally {
                setBusy(false);
              }
            } else {
              const value = [...(field.value || []), ...acceptedFiles];
              setValue(name, value, { shouldValidate: true });
            }
            return;
          }

          const file = acceptedFiles[0];
          if (!file) return;

          if (uploadImmediately) {
            setBusy(true);
            try {
              const label = getUploadName?.() ?? getValues('name') ?? 'upload';
              const url = await uploadFile(file, label);
              setValue(name, url, { shouldValidate: true, shouldDirty: true });
              toast.success('Image uploaded');
            } catch (e) {
              toast.error(e?.message || 'Upload failed');
            } finally {
              setBusy(false);
            }
          } else {
            setValue(name, file, { shouldValidate: true });
          }
        };

        return <Upload {...uploadProps} value={field.value} onDrop={onDrop} {...other} />;
      }}
    />
  );
}
