import { OnboardingProgressHeader } from './onboarding-progress-header';
import { useOnboardingActive } from 'src/hooks/use-onboarding-mode';

// ----------------------------------------------------------------------

export function OnboardingSetupShell({ subtitle, children = null }) {
  const { active: onboarding, progress, progressLoading } = useOnboardingActive();

  if (!onboarding) {
    return children;
  }

  return (
    <>
      {!progressLoading && progress && (
        <OnboardingProgressHeader progress={progress} subtitle={subtitle} />
      )}
      {children}
    </>
  );
}
