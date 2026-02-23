import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
// import { _userList } from 'src/_mock/_user';
import { useGetUserDetails } from 'src/actions/user';

import { UserEditView } from 'src/sections/user/view';

// ----------------------------------------------------------------------

const metadata = { title: `User edit | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { id } = useParams();

  const { user, userLoading, userError } = useGetUserDetails(id);

  if (userLoading) {
    return <div>Loading user details...</div>;
  }

  if (userError) {
    return <div>Error loading user details. Please try again later.</div>;
  }

  // const currentUser = _userList.find((user) => user.id === id);

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <UserEditView user={user} />
    </>
  );
}
