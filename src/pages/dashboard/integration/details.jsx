import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { IntegrationDetailsView } from 'src/sections/integration/view';

// ----------------------------------------------------------------------

export default function IntegrationDetailsPage() {
  const { id } = useParams();

  return (
    <>
      <Helmet>
        <title> Dashboard: Integration Details</title>
      </Helmet>

      <IntegrationDetailsView id={id} />
    </>
  );
}

