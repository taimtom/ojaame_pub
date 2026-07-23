import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { paramCase } from 'src/utils/change-case';
import { CONFIG } from 'src/config-global';
import { DigitalProductListView } from 'src/sections/digital-product/view/digital-product-list-view';

const metadata = { title: `Digital products | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { storeParam } = useParams();
  let storeSlug = storeParam;
  if (!storeSlug) {
    const raw = localStorage.getItem('activeWorkspace');
    if (raw) {
      try {
        const ws = JSON.parse(raw);
        if (ws?.storeName && ws?.id) {
          storeSlug = `${paramCase(ws.storeName)}-${ws.id}`;
        }
      } catch {
        /* ignore */
      }
    }
  }
  const storeId = storeSlug?.split('-').pop();

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <DigitalProductListView storeSlug={storeSlug} storeId={storeId} />
    </>
  );
}
