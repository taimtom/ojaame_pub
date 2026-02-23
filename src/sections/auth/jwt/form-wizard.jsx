// import { z as zod } from 'zod';
// import { useState, useCallback } from 'react';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { useForm, FormProvider } from 'react-hook-form';
// import { isValidPhoneNumber } from 'react-phone-number-input/input';

// import Box from '@mui/material/Box';
// // import Link from '@mui/material/Link'
// import Card from '@mui/material/Card';
// import Button from '@mui/material/Button';
// import LoadingButton from '@mui/lab/LoadingButton';

// import { paths } from 'src/routes/paths';
// // import { RouterLink } from 'src/routes/components';

// import { toast } from 'src/components/snackbar';
// import { Form,schemaHelper } from 'src/components/hook-form';

// import { Stepper, StepOne, StepTwo, StepThree, StepCompleted } from './form-steps';


// // ----------------------------------------------------------------------

// const steps = ['(owner details)', '(Company Details)', '(Account Password)'];

// const StepOneSchema = zod.object({
//   firstName: zod.string().min(1, { message: 'Full name is required!' }),
//   lastName: zod.string().min(1, { message: 'Last name is required!' }),
//   email: zod
//   .string()
//   .min(1, { message: 'Email is required!' })
//   .email({ message: 'Email must be a valid email address!' }),
//   phoneNumber: schemaHelper.phoneNumber({ isValidPhoneNumber }),
// });

// const StepTwoSchema = zod.object({
//   companyName: zod.string().min(1, { message: 'Company name is required!' }),
//   companyLocation: zod.string().min(1, { message: 'Company Location is required!' }),
//   // companyType: zod.string().min(1, { message: 'Company Type is required!' }),
//   companyType: zod.enum(["Wholesales", "Retail", "Wholesales/Retail"], {
//     message: "Company Type is required"}),
//   CompanyLogo: zod.any().optional(),
// });

// const StepThreeSchema = zod.object({
//   password: zod
//   .string()
//   .min(1, { message: 'Password is required!' })
//   .min(6, { message: 'Password is too short!' }),
// });

// const WizardSchema = zod.object({
//   stepOne: StepOneSchema,
//   stepTwo: StepTwoSchema,
//   stepThree: StepThreeSchema,
// });

// // ----------------------------------------------------------------------

// const defaultValues = {
//   stepOne: { firstName: '', lastName: '',phoneNumber: '',email: ''},
//   stepTwo: { companyName: '', companyLocation: '',companyType: 'null', companyLogo: '' },
//   stepThree: { password: ''},
// };

// export function FormWizard() {

//   const [activeStep, setActiveStep] = useState(0);

//   const methods = useForm({
//     mode: 'onChange',
//     resolver: zodResolver(WizardSchema),
//     defaultValues,
//   });


//   const {
//     reset,
//     trigger,
//     handleSubmit,
//     formState: { isSubmitting },
//     setValue
//   } = methods;


//   const handleNext = useCallback(
//     async (step) => {
//       if (step) {
//         const isValid = await trigger(step);

//         if (isValid) {
//           setActiveStep((prevActiveStep) => prevActiveStep + 1);
//         }
//       } else {
//         setActiveStep((prevActiveStep) => prevActiveStep + 1);
//       }
//     },
//     [trigger]
//   );

//   const handleBack = useCallback(() => {
//     setActiveStep((prevActiveStep) => prevActiveStep - 1);
//   }, []);

//   const handleReset = useCallback(() => {
//     reset();
//     setActiveStep(0);
//   }, [reset]);

//   const onSubmit = handleSubmit(async (data) => {
//     try {
//       await new Promise((resolve) => setTimeout(resolve, 1000));

//       toast.success('Create success!');
//       console.info('DATA', data);
//       handleNext();
//       window.location.href = paths.auth.jwt.verify;
//     // <Link component={RouterLink} href={paths.auth.jwt.signUp} variant="subtitle2"></Link>
//     } catch (error) {
//       console.error(error);
//     }
//   });

//   const completedStep = activeStep === steps.length;

//   return (
//     <FormProvider {...methods}>

//     <Card sx={{ p: 5, width: 1, mx: 'auto', maxWidth: 720 }}>
//       <Form methods={methods} onSubmit={onSubmit}>
//         <Stepper steps={steps} activeStep={activeStep} />

//         <Box
//           gap={3}
//           display="flex"
//           flexDirection="column"
//           sx={{
//             p: 3,
//             mb: 3,
//             minHeight: 240,
//             borderRadius: 1.5,
//             border: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
//           }}
//         >
//           {activeStep === 0 && <StepOne />}
//           {activeStep === 1 && <StepTwo setValue={setValue} />}
//           {activeStep === 2 && <StepThree />}
//           {completedStep && <StepCompleted onReset={handleReset} />}
//         </Box>

//         {!completedStep && (
//           <Box display="flex">
//             {activeStep !== 0 && <Button onClick={handleBack}>Back</Button>}

//             <Box sx={{ flex: '1 1 auto' }} />

//             {activeStep === 0 && (
//               <Button variant="contained" onClick={() => handleNext('stepOne')}>
//                 Next
//               </Button>
//             )}
//             {activeStep === 1 && (
//               <Button variant="contained" onClick={() => handleNext('stepTwo')}>
//                 Next
//               </Button>
//             )}
//             {activeStep === 2 && (
//               <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
//                 Save changes
//               </LoadingButton>

//             )}

//           </Box>
//         )}
//       </Form>
//     </Card>
//           </FormProvider>
//   );
// }
