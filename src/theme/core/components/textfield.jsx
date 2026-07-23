import { inputBaseClasses } from '@mui/material/InputBase';
import { filledInputClasses } from '@mui/material/FilledInput';
import { outlinedInputClasses } from '@mui/material/OutlinedInput';

import { varAlpha } from '../../styles';

// ----------------------------------------------------------------------

const MuiInputBase = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      [`&:not(.${inputBaseClasses.multiline})`]: {
        minHeight: 44,
      },
      [`&.${inputBaseClasses.disabled}`]: {
        '& svg': { color: theme.vars.palette.text.disabled },
      },
    }),
    input: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(16),
      fontWeight: theme.typography.fontWeightMedium,
      '&::placeholder': {
        opacity: 1,
        color: theme.vars.palette.text.disabled,
        fontWeight: theme.typography.fontWeightRegular,
      },
    }),
  },
};

// ----------------------------------------------------------------------

const MuiInput = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    underline: ({ theme }) => ({
      '&::before': { borderBottomColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.32) },
      '&::after': { borderBottomColor: theme.vars.palette.text.primary },
    }),
  },
};

// ----------------------------------------------------------------------

const MuiOutlinedInput = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      [`&.${outlinedInputClasses.focused}`]: {
        [`& .${outlinedInputClasses.notchedOutline}`]: {
          borderColor: theme.vars.palette.text.primary,
          borderWidth: 2,
        },
      },
      [`&.${outlinedInputClasses.error}`]: {
        [`& .${outlinedInputClasses.notchedOutline}`]: {
          borderColor: theme.vars.palette.error.main,
          borderWidth: 2,
        },
      },
      [`&.${outlinedInputClasses.disabled}`]: {
        [`& .${outlinedInputClasses.notchedOutline}`]: {
          borderColor: theme.vars.palette.action.disabledBackground,
          borderWidth: 2,
        },
      },
    }),
    notchedOutline: ({ theme }) => ({
      borderWidth: 2,
      borderColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.52),
      transition: theme.transitions.create(['border-color', 'border-width'], {
        duration: theme.transitions.duration.shortest,
      }),
    }),
  },
};

// ----------------------------------------------------------------------

const MuiFilledInput = {
  /** **************************************
   * DEFAULT PROPS
   *************************************** */
  defaultProps: { disableUnderline: true },

  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: theme.shape.borderRadius,
      backgroundColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
      '&:hover': { backgroundColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.16) },
      [`&.${filledInputClasses.focused}`]: {
        backgroundColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
      },
      [`&.${filledInputClasses.error}`]: {
        backgroundColor: varAlpha(theme.vars.palette.error.mainChannel, 0.08),
        [`&.${filledInputClasses.focused}`]: {
          backgroundColor: varAlpha(theme.vars.palette.error.mainChannel, 0.16),
        },
      },
      [`&.${filledInputClasses.disabled}`]: {
        backgroundColor: theme.vars.palette.action.disabledBackground,
      },
    }),
  },
};

// ----------------------------------------------------------------------

export const textfield = {
  MuiInput,
  MuiInputBase,
  MuiFilledInput,
  MuiOutlinedInput,
};
