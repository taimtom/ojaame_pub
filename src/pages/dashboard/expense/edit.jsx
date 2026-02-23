import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

// import { _jobs } from 'src/_mock/_job';
import { CONFIG } from 'src/config-global';
import { useGetExpense } from 'src/actions/expense';

import { ExpenseEditView } from 'src/sections/expense/view';

// ----------------------------------------------------------------------

const metadata = { title: `Expenses edit | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { storeParam, id = '' } = useParams();


  const currentStoreSlug = storeParam || 'default-store';

  const parts = currentStoreSlug.split('-');
  const numericStoreId = parts[parts.length - 1];
  const storeNameSlug = parts.slice(0, -1).join('-') || currentStoreSlug;

  const expenseId = id ? parseInt(id, 10) : null;
  const { expense, isLoading } = useGetExpense(expenseId, numericStoreId);

  return (
    <>
        <Helmet>
              <title> {metadata.title} {storeNameSlug ? `- Store ${storeNameSlug}` : ''}</title>
            </Helmet>
            {!isLoading && <ExpenseEditView expense={expense} storeId={numericStoreId} storeSlug={currentStoreSlug}       // For routing (keeps the friendly slug)
        storeNameSlug={storeNameSlug}   />}
      {/* <ExpenseEditView job={currentJob} storeId={numericStoreId}/> */}
    </>
  );
}
