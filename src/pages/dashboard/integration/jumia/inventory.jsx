import { Helmet } from 'react-helmet-async';

import { JumiaInventoryView } from 'src/sections/integration/view';

// ----------------------------------------------------------------------

export default function JumiaInventoryPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Jumia Inventory Integration</title>
      </Helmet>

      <JumiaInventoryView />
    </>
  );
}

