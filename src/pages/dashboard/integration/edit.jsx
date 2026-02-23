import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { IntegrationEditView } from 'src/sections/integration/view';

// ----------------------------------------------------------------------

export default function IntegrationEditPage() {
  const { id } = useParams();

  return (
    <>
      <Helmet>
        <title> Dashboard: Edit Integration</title>
      </Helmet>

      <IntegrationEditView id={id} />
    </>
  );
}

