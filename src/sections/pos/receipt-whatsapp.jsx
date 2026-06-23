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
    { src: '/fonts/Roboto-Bold.ttf' },
  ],
});

const MM_TO_PT = 2.83465;
const WHATSAPP_PAGE_WIDTH_MM = 110;
const WHATSAPP_PAGE_HEIGHT_PT = 841.89;

function widthToPt(mm) {
  return mm * MM_TO_PT;
}

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        page: {
          fontSize: 11,
          lineHeight: 1.4,
          fontFamily: 'Roboto',
          backgroundColor: '#FFFFFF',
          padding: '24px 20px',
          width: `${WHATSAPP_PAGE_WIDTH_MM}mm`,
          minHeight: 'auto',
        },
        header: {
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: 18,
        },
        logo: {
          width: 48,
          height: 48,
          marginBottom: 8,
          alignSelf: 'center',
        },
        companyName: {
          fontSize: 20,
          fontWeight: 'bold',
          marginBottom: 4,
        },
        companyDetails: {
          fontSize: 10,
          marginBottom: 2,
          textAlign: 'center',
        },
        divider: {
          borderBottomWidth: 1,
          borderStyle: 'dashed',
          borderColor: '#333',
          marginVertical: 12,
        },
        receiptTitle: {
          fontSize: 14,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 10,
        },
        infoRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 4,
        },
        infoLabel: {
          fontSize: 10,
          fontWeight: 'bold',
        },
        infoValue: {
          fontSize: 10,
        },
        itemHeader: {
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderStyle: 'solid',
          borderColor: '#333',
          paddingVertical: 6,
          marginBottom: 4,
        },
        itemRow: {
          flexDirection: 'row',
          paddingVertical: 3,
          marginBottom: 2,
        },
        itemDesc: {
          width: '45%',
          fontSize: 10,
        },
        itemQty: {
          width: '15%',
          fontSize: 10,
          textAlign: 'center',
        },
        itemPrice: {
          width: '20%',
          fontSize: 10,
          textAlign: 'right',
        },
        itemTotal: {
          width: '20%',
          fontSize: 10,
          textAlign: 'right',
        },
        summaryRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 4,
        },
        summaryLabel: {
          fontSize: 11,
        },
        summaryValue: {
          fontSize: 11,
        },
        totalRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          borderTopWidth: 1,
          borderStyle: 'solid',
          borderColor: '#333',
          paddingTop: 6,
          marginTop: 6,
        },
        totalLabel: {
          fontSize: 16,
          fontWeight: 'bold',
        },
        totalValue: {
          fontSize: 16,
          fontWeight: 'bold',
        },
        paymentSection: {
          marginTop: 14,
        },
        paymentTitle: {
          fontSize: 11,
          fontWeight: 'bold',
          marginBottom: 6,
        },
        paymentRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 3,
        },
        paymentMethod: {
          fontSize: 10,
        },
        paymentAmount: {
          fontSize: 10,
        },
        footer: {
          marginTop: 18,
          alignItems: 'center',
          textAlign: 'center',
        },
        thankYou: {
          fontSize: 12,
          fontWeight: 'bold',
          marginBottom: 6,
        },
        footerText: {
          fontSize: 9,
          marginBottom: 3,
          textAlign: 'center',
        },
        barcode: {
          fontSize: 9,
          fontFamily: 'Courier',
          textAlign: 'center',
          marginTop: 8,
        },
      }),
    []
  );

// ----------------------------------------------------------------------

/** WhatsApp-optimized receipt layout (wider page, larger fonts for chat sharing). */
export function WhatsappReceiptPDF({ receipt, currentStatus }) {
  const {
    items = [],
    payments = [],
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

  const styles = useStyles();

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <Document>
      <Page
        size={[widthToPt(WHATSAPP_PAGE_WIDTH_MM), WHATSAPP_PAGE_HEIGHT_PT]}
        style={styles.page}
        wrap
      >
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

        {payments && payments.length > 0 && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>PAYMENT DETAILS</Text>
            {payments.map((payment, index) => (
              <View key={index} style={styles.paymentRow}>
                <Text style={styles.paymentMethod}>
                  {payment.payment_method_name ||
                    payment.method_type?.replace('_', ' ').toUpperCase() ||
                    `Method ${index + 1}`}
                </Text>
                <Text style={styles.paymentAmount}>{fCurrency(payment.amount)}</Text>
              </View>
            ))}
            <View style={styles.paymentRow}>
              <Text style={[styles.paymentMethod, { fontWeight: 'bold' }]}>Total Paid:</Text>
              <Text style={[styles.paymentAmount, { fontWeight: 'bold' }]}>
                {fCurrency(totalPaid)}
              </Text>
            </View>
            {totalPaid > total_amount && (
              <View style={styles.paymentRow}>
                <Text style={[styles.paymentMethod, { fontWeight: 'bold' }]}>Change:</Text>
                <Text style={[styles.paymentAmount, { fontWeight: 'bold' }]}>
                  {fCurrency(totalPaid - total_amount)}
                </Text>
              </View>
            )}
            {totalPaid < total_amount && (
              <View style={styles.paymentRow}>
                <Text style={[styles.paymentMethod, { fontWeight: 'bold', color: '#d32f2f' }]}>
                  Balance:
                </Text>
                <Text style={[styles.paymentAmount, { fontWeight: 'bold', color: '#d32f2f' }]}>
                  {fCurrency(total_amount - totalPaid)}
                </Text>
              </View>
            )}
            <View style={styles.divider} />
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.thankYou}>THANK YOU!</Text>
          <Text style={styles.footerText}>Please come again</Text>
          <Text style={styles.footerText}>Status: {currentStatus?.toUpperCase()}</Text>
          {currentStatus === 'credit' && (
            <Text style={[styles.footerText, { fontWeight: 'bold' }]}>**CREDIT SALE**</Text>
          )}
          <Text style={styles.barcode}>||||| {invoice_number} |||||</Text>
        </View>
      </Page>
    </Document>
  );
}
