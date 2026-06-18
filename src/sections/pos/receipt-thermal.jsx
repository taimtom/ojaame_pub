import { useMemo } from 'react';
import { Page, View, Text, Font, Image, Document, StyleSheet } from '@react-pdf/renderer';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';
import { lineItemTotal, resolveReceiptSubtotal } from 'src/utils/escpos/receipt-from-sale';

// ----------------------------------------------------------------------

Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf' },
    { src: '/fonts/Roboto-Bold.ttf' }
  ],
});

// 1 mm ≈ 2.83465 pt; A4 height for multi-page thermal strips.
const MM_TO_PT = 2.83465;
const THERMAL_PAGE_HEIGHT_PT = 841.89;

function thermalWidthToPt(mm) {
  return mm * MM_TO_PT;
}

function scaleSize(value, scale) {
  return Math.round(value * scale * 10) / 10;
}

const useStyles = (paperWidthMm = 80) => {
  const scale = paperWidthMm / 80;

  return useMemo(
    () =>
      StyleSheet.create({
        page: {
          fontSize: scaleSize(8, scale),
          lineHeight: 1.4,
          fontFamily: 'Roboto',
          backgroundColor: '#FFFFFF',
          padding: `${scaleSize(10, scale)}px ${scaleSize(8, scale)}px`,
          width: `${paperWidthMm}mm`,
          minHeight: 'auto',
        },
        header: {
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: scaleSize(15, scale),
        },
        logo: {
          width: scaleSize(30, scale),
          height: scaleSize(30, scale),
          marginBottom: scaleSize(5, scale),
          alignSelf: 'center',
        },
        companyName: {
          fontSize: scaleSize(12, scale),
          fontWeight: 'bold',
          marginBottom: scaleSize(2, scale),
        },
        companyDetails: {
          fontSize: scaleSize(7, scale),
          marginBottom: scaleSize(1, scale),
          textAlign: 'center',
        },
        divider: {
          borderBottomWidth: 1,
          borderStyle: 'dashed',
          borderColor: '#333',
          marginVertical: scaleSize(8, scale),
        },
        receiptTitle: {
          fontSize: scaleSize(10, scale),
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: scaleSize(8, scale),
        },
        infoRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: scaleSize(2, scale),
        },
        infoLabel: {
          fontSize: scaleSize(7, scale),
          fontWeight: 'bold',
        },
        infoValue: {
          fontSize: scaleSize(7, scale),
        },
        itemHeader: {
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderStyle: 'solid',
          borderColor: '#333',
          paddingVertical: scaleSize(3, scale),
          marginBottom: scaleSize(3, scale),
        },
        itemRow: {
          flexDirection: 'row',
          paddingVertical: scaleSize(1, scale),
          marginBottom: scaleSize(1, scale),
        },
        itemDesc: {
          width: '45%',
          fontSize: scaleSize(7, scale),
        },
        itemQty: {
          width: '15%',
          fontSize: scaleSize(7, scale),
          textAlign: 'center',
        },
        itemPrice: {
          width: '20%',
          fontSize: scaleSize(7, scale),
          textAlign: 'right',
        },
        itemTotal: {
          width: '20%',
          fontSize: scaleSize(7, scale),
          textAlign: 'right',
        },
        summaryRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: scaleSize(2, scale),
        },
        summaryLabel: {
          fontSize: scaleSize(8, scale),
        },
        summaryValue: {
          fontSize: scaleSize(8, scale),
        },
        totalRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          borderTopWidth: 1,
          borderStyle: 'solid',
          borderColor: '#333',
          paddingTop: scaleSize(3, scale),
          marginTop: scaleSize(3, scale),
        },
        totalLabel: {
          fontSize: scaleSize(9, scale),
          fontWeight: 'bold',
        },
        totalValue: {
          fontSize: scaleSize(9, scale),
          fontWeight: 'bold',
        },
        paymentSection: {
          marginTop: scaleSize(10, scale),
        },
        paymentTitle: {
          fontSize: scaleSize(8, scale),
          fontWeight: 'bold',
          marginBottom: scaleSize(3, scale),
        },
        paymentRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: scaleSize(1, scale),
        },
        paymentMethod: {
          fontSize: scaleSize(7, scale),
        },
        paymentAmount: {
          fontSize: scaleSize(7, scale),
        },
        footer: {
          marginTop: scaleSize(15, scale),
          alignItems: 'center',
          textAlign: 'center',
        },
        thankYou: {
          fontSize: scaleSize(9, scale),
          fontWeight: 'bold',
          marginBottom: scaleSize(5, scale),
        },
        footerText: {
          fontSize: scaleSize(6, scale),
          marginBottom: scaleSize(2, scale),
          textAlign: 'center',
        },
        barcode: {
          fontSize: scaleSize(6, scale),
          fontFamily: 'Courier',
          textAlign: 'center',
          marginTop: scaleSize(5, scale),
        },
      }),
    [paperWidthMm, scale]
  );
};

// ----------------------------------------------------------------------

/** @param {object} props
 *  @param {object} props.receipt
 *  @param {string} [props.currentStatus]
 *  @param {58|80} [props.paperWidthMm] Roll width in mm (default 80). */
export function ThermalReceiptPDF({ receipt, currentStatus, paperWidthMm = 80 }) {
  const widthMm = paperWidthMm === 58 ? 58 : 80;
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
    rc_cac_reg_number,
    user_fullname,
  } = receipt || {};

  const resolvedSubtotal = useMemo(
    () => resolveReceiptSubtotal({ items, subtotal, total_amount, taxes, discount, shipping }),
    [items, subtotal, total_amount, taxes, discount, shipping]
  );

  const styles = useStyles(widthMm);

  const renderHeader = (
    <View style={styles.header}>
      <Image source="/logo/logo-single.png" style={styles.logo} />
      <Text style={styles.companyName}>{store_name || 'Your Store'}</Text>
      <Text style={styles.companyDetails}>{store_address}</Text>
      <Text style={styles.companyDetails}>Tel: {store_phone}</Text>
      {rc_cac_reg_number ? (
        <Text style={styles.companyDetails}>{rc_cac_reg_number}</Text>
      ) : null}
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
          <Text style={styles.itemTotal}>{fCurrency(lineItemTotal(item))}</Text>
        </View>
      ))}
      <View style={styles.divider} />
    </View>
  );

  const renderSummary = (
    <View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal:</Text>
        <Text style={styles.summaryValue}>{fCurrency(resolvedSubtotal)}</Text>
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
      <Page size={[thermalWidthToPt(widthMm), THERMAL_PAGE_HEIGHT_PT]} style={styles.page} wrap>
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

