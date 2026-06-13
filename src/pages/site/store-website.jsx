import { useParams } from 'src/routes/hooks';
import { useStoreWebsite } from 'src/layouts/store-website/context';
import { getStoreWebsiteTemplate } from 'src/config/store-website-templates';
import { StoreWebsiteView } from 'src/sections/store-website/store-website-view';

export default function StoreWebsitePage() {
  const website = useStoreWebsite();
  const { slug } = useParams();

  if (!website) {
    return null;
  }

  const template = getStoreWebsiteTemplate(website?.template_id);

  return <StoreWebsiteView website={website} template={template} slug={slug} />;
}
