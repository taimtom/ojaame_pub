import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { paramCase } from 'src/utils/change-case';
import { CONFIG } from 'src/config-global';
import { useGetDigitalProduct } from 'src/actions/digital-product';
import { DigitalProductEditView } from 'src/sections/digital-product/view/digital-product-edit-view';
import { LoadingScreen } from 'src/components/loading-screen';

const metadata = { title: `Edit digital product | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { storeParam, id } = useParams();
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
  const { digitalProduct, digitalProductLoading } = useGetDigitalProduct(id, storeId);

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      {digitalProductLoading ? (
        <LoadingScreen />
      ) : (
        <DigitalProductEditView
          storeSlug={storeSlug}
          storeId={storeId}
          currentProduct={digitalProduct}
        />
      )}
    </>
  );
}
