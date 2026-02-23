import { useMemo } from 'react';
import { Page, View, Text, Font, Image, Document, StyleSheet } from '@react-pdf/renderer';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf' },
    { src: '/fonts/Roboto-Bold.ttf' }
  ],
});

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        // A4 page layout
        page: {
          fontSize: 10,
          lineHeight: 1.6,
          fontFamily: 'Roboto',
          backgroundColor: '#FFFFFF',
          padding: '40px 24px 120px 24px',
        },
        footer: {
          left: 0,
          right: 0,
          bottom: 0,
          padding: 24,
          margin: 'auto',
          borderTopWidth: 1,
          borderStyle: 'solid',
          position: 'absolute',
          borderColor: '#e9ecef',
        },
        container: {
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        // Receipt-specific styles
        receiptHeader: {
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: 30,
          borderBottomWidth: 2,
          borderStyle: 'solid',
          borderColor: '#007bff',
          paddingBottom: 20,
        },
        receiptTitle: {
          fontSize: 24,
          fontWeight: 'bold',
          color: '#007bff',
          marginBottom: 10,
        },
        receiptSubtitle: {
          fontSize: 12,
          color: '#666',
        },
        // Status badge
        statusBadge: {
          alignSelf: 'center',
          backgroundColor: '#f8f9fa',
          padding: '8px 16px',
          borderRadius: 4,
          marginBottom: 20,
        },
        statusText: {
          fontSize: 14,
          fontWeight: 'bold',
          textTransform: 'uppercase',
        },
        // margin
        mb4: { marginBottom: 4 },
        mb8: { marginBottom: 8 },
        mb20: { marginBottom: 20 },
        mb40: { marginBottom: 40 },
        // text
        h3: { fontSize: 16, fontWeight: 'bold' },
        h4: { fontSize: 13, fontWeight: 'bold' },
        body1: { fontSize: 10 },
        subtitle1: { fontSize: 10, fontWeight: 'bold' },
        body2: { fontSize: 9 },
        subtitle2: { fontSize: 9, fontWeight: 'bold' },
        // table
        table: { display: 'flex', width: '100%' },
        row: {
          padding: '12px 0 10px 0',
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderStyle: 'solid',
          borderColor: '#e9ecef',
        },
        cell_1: { width: '5%' },
        cell_2: { width: '50%' },
        cell_3: { width: '15%', paddingLeft: 32 },
        cell_4: { width: '15%', paddingLeft: 8 },
        cell_5: { width: '15%' },
        noBorder: { paddingTop: '10px', paddingBottom: 0, borderBottomWidth: 0 },
        // Payment summary styles
        paymentSummary: {
          marginTop: 30,
          padding: 20,
          backgroundColor: '#f8f9fa',
          borderRadius: 8,
        },
        paymentTitle: {
          fontSize: 14,
          fontWeight: 'bold',
          marginBottom: 15,
        },
        paymentRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
        },
        paymentMethod: {
          fontSize: 10,
        },
        paymentAmount: {
          fontSize: 10,
          fontWeight: 'bold',
        },
        changeRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderStyle: 'solid',
          borderColor: '#007bff',
        },
        changeLabel: {
          fontSize: 12,
          fontWeight: 'bold',
          color: '#007bff',
        },
        changeAmount: {
          fontSize: 12,
          fontWeight: 'bold',
          color: '#007bff',
        },
        // Credit sale warning
        creditWarning: {
          marginTop: 20,
          padding: 15,
          backgroundColor: '#fff3cd',
          borderRadius: 8,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: '#ffc107',
        },
        creditWarningText: {
          fontSize: 12,
          fontWeight: 'bold',
          color: '#856404',
          textAlign: 'center',
        },
        // Summary totals
        summarySection: {
          marginTop: 20,
          padding: 15,
          backgroundColor: '#f8f9fa',
          borderRadius: 8,
        },
      }),
    []
  );

// ----------------------------------------------------------------------

export function A4ReceiptPDF({ receipt, currentStatus }) {
  const {
    items = [],
    payments = [],
    taxes = 0,
    due_date,
    discount = 0,
    shipping = 0,
    subtotal = 0,
    create_date,
    total_amount = 0,
    invoice_number,
    customer_name,
    customer_address,
    customer_state,
    customer_country,
    customer_phone,
    store_name,
    store_address,
    store_state,
    store_country,
    store_phone,
    user_fullname,
  } = receipt || {};

  const styles = useStyles();

  // Calculate payment totals
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const changeAmount = totalPaid - total_amount;

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return '#28a745';
      case 'credit': return '#ffc107';
      case 'draft': return '#6c757d';
      default: return '#007bff';
    }
  };

  const renderHeader = (
    <View style={styles.receiptHeader}>
      <Image source="/logo/logo-single.png" style={{ width: 60, height: 60, marginBottom: 10 }} />
      <Text style={styles.receiptTitle}>SALES RECEIPT</Text>
      <Text style={styles.receiptSubtitle}>
        Receipt #{invoice_number} • {fDate(create_date)}
      </Text>
      <View
      style={[
        styles.statusBadge,
        { backgroundColor: `${getStatusColor(currentStatus)}20` },
        ]}
      >
        <Text style={[styles.statusText, { color: getStatusColor(currentStatus) }]}>
          {currentStatus || 'Unknown'}
        </Text>
      </View>
    </View>
  );

  const renderStoreAndCustomerInfo = (
    <View style={[styles.container, styles.mb40]}>
      {/* Store details */}
      <View style={{ width: '50%' }}>
        <Text style={[styles.subtitle2, styles.mb4]}>From</Text>
        <Text style={[styles.h4, styles.mb4]}>{store_name || 'Your Store'}</Text>
        <Text style={styles.body2}>{store_address}</Text>
        <Text style={styles.body2}>
          {store_state && store_country ? `${store_state}, ${store_country}` : ''}
        </Text>
        <Text style={styles.body2}>Phone: {store_phone}</Text>
      </View>

      {/* Customer details */}
      <View style={{ width: '50%' }}>
        <Text style={[styles.subtitle2, styles.mb4]}>To</Text>
        <Text style={[styles.h4, styles.mb4]}>{customer_name || 'Walk-in Customer'}</Text>
        {customer_address && (
          <>
            <Text style={styles.body2}>{customer_address}</Text>
            <Text style={styles.body2}>
              {customer_state && customer_country ? `${customer_state}, ${customer_country}` : ''}
            </Text>
          </>
        )}
        {customer_phone && <Text style={styles.body2}>Phone: {customer_phone}</Text>}
      </View>
    </View>
  );

  const renderReceiptDetails = (
    <View style={[styles.container, styles.mb40]}>
      <View style={{ width: '50%' }}>
        <Text style={[styles.subtitle2, styles.mb4]}>Receipt Details</Text>
        <Text style={styles.body2}>Date: {fDate(create_date)}</Text>
        <Text style={styles.body2}>Due Date: {fDate(due_date)}</Text>
      </View>
      <View style={{ width: '50%' }}>
        <Text style={[styles.subtitle2, styles.mb4]}>Served By</Text>
        <Text style={styles.body2}>{user_fullname || 'Staff'}</Text>
      </View>
    </View>
  );

  const renderItemsTable = (
    <>
      <Text style={[styles.subtitle1, styles.mb8]}>Items Purchased</Text>
      <View style={styles.table}>
        <View>
          <View style={styles.row}>
            <View style={styles.cell_1}>
              <Text style={styles.subtitle2}>#</Text>
            </View>
            <View style={styles.cell_2}>
              <Text style={styles.subtitle2}>Description</Text>
            </View>
            <View style={styles.cell_3}>
              <Text style={styles.subtitle2}>Qty</Text>
            </View>
            <View style={styles.cell_4}>
              <Text style={styles.subtitle2}>Unit Price</Text>
            </View>
            <View style={[styles.cell_5, { textAlign: 'right' }]}>
              <Text style={styles.subtitle2}>Total</Text>
            </View>
          </View>
        </View>
        <View>
          {items.map((item, index) => (
            <View key={index} style={styles.row}>
              <View style={styles.cell_1}>
                <Text style={styles.body2}>{index + 1}</Text>
              </View>
              <View style={styles.cell_2}>
                <Text style={styles.body2}>
                  {item.description || item.product_name || item.service_name || 'Item'}
                </Text>
              </View>
              <View style={styles.cell_3}>
                <Text style={styles.body2}>{item.quantity}</Text>
              </View>
              <View style={styles.cell_4}>
                <Text style={styles.body2}>{fCurrency(item.price)}</Text>
              </View>
              <View style={[styles.cell_5, { textAlign: 'right' }]}>
                <Text style={styles.body2}>{fCurrency(item.quantity * item.price)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  );

  const renderSummary = (
    <View style={styles.summarySection}>
      <View style={[styles.container, styles.mb4]}>
        <Text style={styles.body1}>Subtotal</Text>
        <Text style={styles.body1}>{fCurrency(subtotal)}</Text>
      </View>
      {discount > 0 && (
        <View style={[styles.container, styles.mb4]}>
          <Text style={styles.body1}>Discount</Text>
          <Text style={styles.body1}>-{fCurrency(discount)}</Text>
        </View>
      )}
      {taxes > 0 && (
        <View style={[styles.container, styles.mb4]}>
          <Text style={styles.body1}>Tax</Text>
          <Text style={styles.body1}>{fCurrency(taxes)}</Text>
        </View>
      )}
      {shipping > 0 && (
        <View style={[styles.container, styles.mb4]}>
          <Text style={styles.body1}>Shipping</Text>
          <Text style={styles.body1}>{fCurrency(shipping)}</Text>
        </View>
      )}
      <View style={[styles.container, { paddingTop: 10, borderTopWidth: 2, borderStyle: 'solid', borderColor: '#007bff' }]}>
        <Text style={[styles.h4, { color: '#007bff' }]}>TOTAL</Text>
        <Text style={[styles.h4, { color: '#007bff' }]}>{fCurrency(total_amount)}</Text>
      </View>
    </View>
  );

  const renderPaymentDetails = payments && payments.length > 0 && (
    <View style={styles.paymentSummary}>
      <Text style={styles.paymentTitle}>Payment Details</Text>
      {payments.map((payment, index) => (
        <View key={index} style={styles.paymentRow}>
          <Text style={styles.paymentMethod}>
            {payment.payment_method_name || payment.method_type?.replace('_', ' ').toUpperCase() || `Payment Method ${index + 1}`}
          </Text>
          <Text style={styles.paymentAmount}>{fCurrency(payment.amount)}</Text>
        </View>
      ))}
      <View style={styles.paymentRow}>
        <Text style={[styles.paymentMethod, { fontWeight: 'bold' }]}>Total Paid:</Text>
        <Text style={[styles.paymentAmount, { fontWeight: 'bold' }]}>{fCurrency(totalPaid)}</Text>
      </View>
      {changeAmount > 0 && (
        <View style={styles.changeRow}>
          <Text style={styles.changeLabel}>Change Given:</Text>
          <Text style={styles.changeAmount}>{fCurrency(changeAmount)}</Text>
        </View>
      )}
      {totalPaid < total_amount && (
        <View style={styles.changeRow}>
          <Text style={[styles.changeLabel, { color: '#d32f2f' }]}>Outstanding Balance:</Text>
          <Text style={[styles.changeAmount, { color: '#d32f2f' }]}>{fCurrency(total_amount - totalPaid)}</Text>
        </View>
      )}
    </View>
  );

  const renderCreditWarning = currentStatus === 'credit' && (
    <View style={styles.creditWarning}>
      <Text style={styles.creditWarningText}>
        ⚠️ CREDIT SALE - PAYMENT PENDING ⚠️
      </Text>
      <Text style={[styles.creditWarningText, { fontSize: 10, marginTop: 5 }]}>
        Outstanding Balance: {fCurrency(total_amount - totalPaid)}
      </Text>
    </View>
  );

  const renderFooter = (
    <View style={[styles.container, styles.footer]} fixed>
      <View style={{ width: '75%' }}>
        <Text style={styles.subtitle2}>Thank you for your business!</Text>
        <Text style={styles.body2}>
          Please keep this receipt for your records. For any inquiries, please contact us.
        </Text>
      </View>
      <View style={{ width: '25%', textAlign: 'right' }}>
        <Text style={styles.subtitle2}>Questions?</Text>
        <Text style={styles.body2}>support@yourstore.com</Text>
        <Text style={styles.body2}>{store_phone}</Text>
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {renderHeader}
        {renderStoreAndCustomerInfo}
        {renderReceiptDetails}
        {renderItemsTable}
        {renderSummary}
        {renderPaymentDetails}
        {renderCreditWarning}
        {renderFooter}
      </Page>
    </Document>
  );
}

