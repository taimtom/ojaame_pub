import { Helmet } from 'react-helmet-async';

import { HomeView } from 'src/sections/home/view';

// ----------------------------------------------------------------------

const metadata = {
  title: 'Ojaame POS — All-in-One Point of Sale for African Businesses',
  description:
    'Ojaame is the fastest, easiest POS system for retail shops, service providers and restaurants. Manage sales, inventory, invoices, credit customers and business analytics — all in one place. Start free today.',
};

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content="POS system Nigeria, point of sale software Africa, inventory management, invoice software, retail POS, quick sale, credit tracking, business analytics" />
        <meta property="og:title" content={metadata.title} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metadata.title} />
        <meta name="twitter:description" content={metadata.description} />
      </Helmet>

      <HomeView />
    </>
  );
}
