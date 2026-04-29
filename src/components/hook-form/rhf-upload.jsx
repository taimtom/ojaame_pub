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

export function RHFUpload({ name, multiple, helperText, ...other }) {
  const { control, setValue } = useFormContext();

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
        };

        const onDrop = (acceptedFiles) => {
          const value = multiple ? [...field.value, ...acceptedFiles] : acceptedFiles[0];

          setValue(name, value, { shouldValidate: true });
        };

        return <Upload {...uploadProps} value={field.value} onDrop={onDrop} {...other} />;
      }}
    />
  );
}
