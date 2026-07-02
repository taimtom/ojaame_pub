import { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { CountrySelect } from 'src/components/country-select';

// ----------------------------------------------------------------------

export function RHFCountrySelect({ name, helperText, ...other }) {
  const { control, setValue, watch } = useFormContext();
  const fieldValue = watch(name);

  useEffect(() => {
    if (other.multiple) return;

    const isEmpty =
      fieldValue === undefined || fieldValue === null || `${fieldValue}`.trim() === '';
    if (!isEmpty) return;

    const nigeriaDefault = other.getValue === 'label' ? 'Nigeria' : 'NG';
    setValue(name, nigeriaDefault, { shouldValidate: true });
  }, [fieldValue, name, other.getValue, other.multiple, setValue]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <CountrySelect
          id={`rhf-country-select-${name}`}
          value={field.value}
          onChange={(event, newValue) => setValue(name, newValue, { shouldValidate: true })}
          error={!!error}
          helperText={error?.message ?? helperText}
          {...other}
        />
      )}
    />
  );
}
