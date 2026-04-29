import { Helmet } from 'react-helmet-async';

import { NotificationsListView } from 'src/sections/notifications/notifications-list-view';

// ----------------------------------------------------------------------

const metadata = { title: 'Notifications' };

export default function NotificationsPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <NotificationsListView />
    </>
  );
}
