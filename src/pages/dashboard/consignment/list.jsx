import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { CONFIG } from 'src/config-global';
import { ConsignmentListView } from 'src/sections/consignment/view/consignment-list-view';

export default function ConsignmentListPage() {
  const { storeParam } = useParams();
  const storeId = storeParam ? storeParam.split('-').pop() : null;

  return (
    <>
      <Helmet>
        <title>Consignment | {CONFIG.site.name}</title>
      </Helmet>
      <ConsignmentListView storeId={storeId} storeParam={storeParam} />
    </>
  );
}
