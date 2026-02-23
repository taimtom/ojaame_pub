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
        // 80mm thermal printer page (57mm usable width)
        page: {
          fontSize: 8,
          lineHeight: 1.4,
          fontFamily: 'Roboto',
          backgroundColor: '#FFFFFF',
          padding: '10px 8px',
          width: '80mm',
          minHeight: 'auto',
        },
        // Header styles
        header: {
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: 15,
        },
        logo: {
          width: 30,
          height: 30,
          marginBottom: 5,
          alignSelf: 'center',
        },
        companyName: {
          fontSize: 12,
          fontWeight: 'bold',
          marginBottom: 2,
        },
        companyDetails: {
          fontSize: 7,
          marginBottom: 1,
          textAlign: 'center',
        },
        divider: {
          borderBottomWidth: 1,
          borderStyle: 'dashed',
          borderColor: '#333',
          marginVertical: 8,
        },
        // Content styles
        receiptTitle: {
          fontSize: 10,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 8,
        },
        infoRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 2,
        },
        infoLabel: {
          fontSize: 7,
          fontWeight: 'bold',
        },
        infoValue: {
          fontSize: 7,
        },
        // Items table
        itemHeader: {
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderStyle: 'solid',
          borderColor: '#333',
          paddingVertical: 3,
          marginBottom: 3,
        },
        itemRow: {
          flexDirection: 'row',
          paddingVertical: 1,
          marginBottom: 1,
        },
        itemDesc: {
          width: '45%',
          fontSize: 7,
        },
        itemQty: {
          width: '15%',
          fontSize: 7,
          textAlign: 'center',
        },
        itemPrice: {
          width: '20%',
          fontSize: 7,
          textAlign: 'right',
        },
        itemTotal: {
          width: '20%',
          fontSize: 7,
          textAlign: 'right',
        },
        // Summary styles
        summaryRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 2,
        },
        summaryLabel: {
          fontSize: 8,
        },
        summaryValue: {
          fontSize: 8,
        },
        totalRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          borderTopWidth: 1,
          borderStyle: 'solid',
          borderColor: '#333',
          paddingTop: 3,
          marginTop: 3,
        },
        totalLabel: {
          fontSize: 9,
          fontWeight: 'bold',
        },
        totalValue: {
          fontSize: 9,
          fontWeight: 'bold',
        },
        // Payment details
        paymentSection: {
          marginTop: 10,
        },
        paymentTitle: {
          fontSize: 8,
          fontWeight: 'bold',
          marginBottom: 3,
        },
        paymentRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 1,
        },
        paymentMethod: {
          fontSize: 7,
        },
        paymentAmount: {
          fontSize: 7,
        },
        // Footer
        footer: {
          marginTop: 15,
          alignItems: 'center',
          textAlign: 'center',
        },
        thankYou: {
          fontSize: 9,
          fontWeight: 'bold',
          marginBottom: 5,
        },
        footerText: {
          fontSize: 6,
          marginBottom: 2,
          textAlign: 'center',
        },
        barcode: {
          fontSize: 6,
          fontFamily: 'Courier',
          textAlign: 'center',
          marginTop: 5,
        },
      }),
    []
  );

// ----------------------------------------------------------------------

export function ThermalReceiptPDF({ receipt, currentStatus }) {
  const {
    items = [],
    payments = [],
    due_date,
    discount = 0,
    shipping = 0,
    subtotal = 0,
    taxes = 0,
    create_date,
    total_amount = 0,
    invoice_number,
    customer_name,
    customer_phone,
    store_name,
    store_address,
    store_phone,
    user_fullname,
  } = receipt || {};

  const styles = useStyles();

  const renderHeader = (
    <View style={styles.header}>
      <Image source="/logo/logo-single.png" style={styles.logo} />
      <Text style={styles.companyName}>{store_name || 'Your Store'}</Text>
      <Text style={styles.companyDetails}>{store_address}</Text>
      <Text style={styles.companyDetails}>Tel: {store_phone}</Text>
      <View style={styles.divider} />
    </View>
  );

  const renderReceiptInfo = (
    <View>
      <Text style={styles.receiptTitle}>SALES RECEIPT</Text>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Receipt #:</Text>
        <Text style={styles.infoValue}>{invoice_number}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Date:</Text>
        <Text style={styles.infoValue}>{fDate(create_date)}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Cashier:</Text>
        <Text style={styles.infoValue}>{user_fullname || 'N/A'}</Text>
      </View>
      {customer_name && customer_name !== 'Walk In Customer' && (
        <>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer:</Text>
            <Text style={styles.infoValue}>{customer_name}</Text>
          </View>
          {customer_phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{customer_phone}</Text>
            </View>
          )}
        </>
      )}
      <View style={styles.divider} />
    </View>
  );

  const renderItems = (
    <View>
      <View style={styles.itemHeader}>
        <Text style={[styles.itemDesc, { fontWeight: 'bold' }]}>Item</Text>
        <Text style={[styles.itemQty, { fontWeight: 'bold' }]}>Qty</Text>
        <Text style={[styles.itemPrice, { fontWeight: 'bold' }]}>Price</Text>
        <Text style={[styles.itemTotal, { fontWeight: 'bold' }]}>Total</Text>
      </View>
      {items.map((item, index) => (
        <View key={index} style={styles.itemRow}>
          <Text style={styles.itemDesc}>
            {item.description || item.product_name || item.service_name || 'Item'}
          </Text>
          <Text style={styles.itemQty}>{item.quantity}</Text>
          <Text style={styles.itemPrice}>{fCurrency(item.price)}</Text>
          <Text style={styles.itemTotal}>{fCurrency(item.quantity * item.price)}</Text>
        </View>
      ))}
      <View style={styles.divider} />
    </View>
  );

  const renderSummary = (
    <View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal:</Text>
        <Text style={styles.summaryValue}>{fCurrency(subtotal)}</Text>
      </View>
      {discount > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Discount:</Text>
          <Text style={styles.summaryValue}>-{fCurrency(discount)}</Text>
        </View>
      )}
      {taxes > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax:</Text>
          <Text style={styles.summaryValue}>{fCurrency(taxes)}</Text>
        </View>
      )}
      {shipping > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping:</Text>
          <Text style={styles.summaryValue}>{fCurrency(shipping)}</Text>
        </View>
      )}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>TOTAL:</Text>
        <Text style={styles.totalValue}>{fCurrency(total_amount)}</Text>
      </View>
    </View>
  );

  const renderPayments = payments && payments.length > 0 && (
    <View style={styles.paymentSection}>
      <Text style={styles.paymentTitle}>PAYMENT DETAILS</Text>
      {payments.map((payment, index) => (
        <View key={index} style={styles.paymentRow}>
          <Text style={styles.paymentMethod}>
            {payment.payment_method_name || payment.method_type?.replace('_', ' ').toUpperCase() || `Method ${index + 1}`}
          </Text>
          <Text style={styles.paymentAmount}>{fCurrency(payment.amount)}</Text>
        </View>
      ))}
      <View style={styles.paymentRow}>
        <Text style={[styles.paymentMethod, { fontWeight: 'bold' }]}>Total Paid:</Text>
        <Text style={[styles.paymentAmount, { fontWeight: 'bold' }]}>
          {fCurrency(payments.reduce((sum, p) => sum + (p.amount || 0), 0))}
        </Text>
      </View>
      {payments.reduce((sum, p) => sum + (p.amount || 0), 0) > total_amount && (
        <View style={styles.paymentRow}>
          <Text style={[styles.paymentMethod, { fontWeight: 'bold' }]}>Change:</Text>
          <Text style={[styles.paymentAmount, { fontWeight: 'bold' }]}>
            {fCurrency(payments.reduce((sum, p) => sum + (p.amount || 0), 0) - total_amount)}
          </Text>
        </View>
      )}
      {payments.reduce((sum, p) => sum + (p.amount || 0), 0) < total_amount && (
        <View style={styles.paymentRow}>
          <Text style={[styles.paymentMethod, { fontWeight: 'bold', color: '#d32f2f' }]}>Balance:</Text>
          <Text style={[styles.paymentAmount, { fontWeight: 'bold', color: '#d32f2f' }]}>
            {fCurrency(total_amount - payments.reduce((sum, p) => sum + (p.amount || 0), 0))}
          </Text>
        </View>
      )}
      <View style={styles.divider} />
    </View>
  );

  const renderFooter = (
    <View style={styles.footer}>
      <Text style={styles.thankYou}>THANK YOU!</Text>
      <Text style={styles.footerText}>Please come again</Text>
      <Text style={styles.footerText}>Status: {currentStatus?.toUpperCase()}</Text>
      {currentStatus === 'credit' && (
        <Text style={[styles.footerText, { fontWeight: 'bold' }]}>
          **CREDIT SALE**
        </Text>
      )}
      <Text style={styles.barcode}>||||| {invoice_number} |||||</Text>
    </View>
  );

  return (
    <Document>
      <Page size="A7" style={styles.page}>
        {renderHeader}
        {renderReceiptInfo}
        {renderItems}
        {renderSummary}
        {renderPayments}
        {renderFooter}
      </Page>
    </Document>
  );
}

