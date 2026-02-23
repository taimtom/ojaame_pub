// import { useFormContext } from 'react-hook-form';

// import Box from '@mui/material/Box';
// import Step from '@mui/material/Step';
// import Button from '@mui/material/Button';
// import Divider from '@mui/material/Divider';
// import MenuItem from '@mui/material/MenuItem';
// import MuiStepper from '@mui/material/Stepper';
// import StepLabel from '@mui/material/StepLabel';
// import IconButton from '@mui/material/IconButton';
// import Typography from '@mui/material/Typography';
// import InputAdornment from '@mui/material/InputAdornment';

// import { useBoolean } from 'src/hooks/use-boolean';

// import { Iconify } from 'src/components/iconify';
// import { Field } from 'src/components/hook-form';


// // ----------------------------------------------------------------------

// export function Stepper({ steps, activeStep }) {
//   return (
//     <MuiStepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
//       {steps.map((label, index) => (
//         <Step key={label}>
//           <StepLabel
//             StepIconComponent={({ active, completed }) => (
//               <Box
//                 display="flex"
//                 alignItems="center"
//                 justifyContent="center"
//                 sx={{
//                   width: 24,
//                   height: 24,
//                   borderRadius: '50%',
//                   color: 'text.disabled',
//                   typography: 'subtitle2',
//                   bgcolor: 'action.disabledBackground',
//                   ...(active && { bgcolor: 'primary.main', color: 'primary.contrastText' }),
//                   ...(completed && { bgcolor: 'primary.main', color: 'primary.contrastText' }),
//                 }}
//               >
//                 {completed ? (
//                   <Iconify width={14} icon="mingcute:check-fill" />
//                 ) : (
//                   <Box sx={{ typography: 'subtitle2' }}>{index + 1}</Box>
//                 )}
//               </Box>
//             )}
//           >
//             {label}
//           </StepLabel>
//         </Step>
//       ))}
//     </MuiStepper>
//   );
// }

// // ----------------------------------------------------------------------

// export function StepOne() {

//   return (
//     <>
//       <Field.Text
//         name="stepOne.firstName"
//         label="First name"
//         variant="filled"
//         InputLabelProps={{ shrink: true }}
//       />
//       <Field.Text
//         name="stepOne.lastName"
//         label="Last name"
//         variant="filled"
//         InputLabelProps={{ shrink: true }}
//       />

//     <Field.Text
//       name="stepOne.email"
//       label="Email"
//       variant="filled"
//       InputLabelProps={{ shrink: true }}
//     />
//     <Field.Phone
//      name="stepOne.phoneNumber"
//      label="Phone number"
//      variant="filled"
//     InputLabelProps={{ shrink: true }}/>
//     </>
//   );
// }

// export function StepTwo({setValue}) {
//   const { errors } = useFormContext();
//   const OPTIONS = [
//     { value: 'ws', label: 'Wholesales' },
//     { value: 're', label: 'Retail' },
//     { value: 'ws-re', label: 'Wholesales/Retail' },
//   ];
//   return (
//     <>
//     <Field.Text
//       name="stepTwo.companyName"
//       label="Company Name"
//       variant="filled"
//       InputLabelProps={{ shrink: true }}
//       helperText="Company Name is Require"
//     />

//     <Field.Text
//       name="stepTwo.companyLocation"
//       label="Company Location"
//       variant="filled"
//       InputLabelProps={{ shrink: true }}
//       helperText="Company Location is Require"
//     />
//     <Field.Select name="stepTwo.companyType" label="Company Type"  variant="filled"
//       InputLabelProps={{ shrink: true }}  helperText="Company Type is Require"
//       >
//       <MenuItem value="">None</MenuItem>
//       <Divider sx={{ borderStyle: 'dashed' }} />
//       {OPTIONS.map((option) => (
//         <MenuItem key={option.value} value={option.label}>
//           {option.label}
//         </MenuItem>
//       ))}
//     </Field.Select>

//       <Field.Upload
//         name="stepTwo.companyLogo"
//         maxSize={3145728}
//         helperText="Company Logo is Require"
//         onDelete={() => setValue('stepTwo.companyLogo', null, { shouldValidate: true })}
//       />


//     </>
//   );
// }

// export function StepThree() {
//   const password = useBoolean();
//   return (
//     <Field.Text
//     name="stepThree.password"
//     label="Password"
//     variant="filled"
//     InputLabelProps={{ shrink: true }}
//     type={password.value ? 'text' : 'password'}
//     InputProps={{
//       endAdornment: (
//         <InputAdornment position="end">
//           <IconButton onClick={password.onToggle} edge="end">
//             <Iconify
//               icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
//               />
//           </IconButton>
//         </InputAdornment>
//       ),
//     }}
//     />

//   );
// }

// export function StepCompleted({ onReset }) {
//   return (
//     <Box
//       gap={3}
//       display="flex"
//       flex="1 1 auto"
//       alignItems="center"
//       flexDirection="column"
//       justifyContent="center"
//       sx={{ borderRadius: 'inherit', bgcolor: 'background.neutral' }}
//     >
//       <Typography variant="subtitle1">All steps completed - you&apos;re finished</Typography>

//       <Button
//         variant="outlined"
//         onClick={onReset}
//         startIcon={<Iconify icon="solar:restart-bold" />}
//       >
//         Reset
//       </Button>
//     </Box>
//   );
// }
