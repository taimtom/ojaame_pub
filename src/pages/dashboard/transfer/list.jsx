import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { CONFIG } from 'src/config-global';
import { TransferListView } from 'src/sections/transfer/view/transfer-list-view';

export default function TransferListPage() {
  const { storeParam } = useParams();
  const storeId = storeParam ? storeParam.split('-').pop() : null;

  return (
    <>
      <Helmet>
        <title>Store Transfers | {CONFIG.site.name}</title>
      </Helmet>
      <TransferListView storeId={storeId} />
    </>
  );
}
