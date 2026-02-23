import useSWR from 'swr';

import { fetcher, endpoints } from 'src/utils/axios';

export function useInvitationDetails(invitationId) {
  const { data, error, isLoading } = useSWR(
    invitationId ? `${endpoints.auth.invitation}/${invitationId}` : null,
    fetcher
  );
  return {
    invitation: data,
    loading: isLoading,
    error,
  };
}
