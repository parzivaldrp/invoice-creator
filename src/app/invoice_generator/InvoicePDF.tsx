import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
} from '@react-pdf/renderer';

import logo from '../../../public/file.svg';

// Types for invoice data
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  fromCompany: string;
  fromAddress: string;
  fromEmail: string;
  fromPhone: string;
  toCompany: string;
  toAddress: string;
  toEmail: string;
  items: InvoiceItem[];
  notes: string;
  taxRate: number;
}

interface InvoicePDFProps {
  invoiceData: InvoiceData;
  subtotal: number;
  taxAmount: number;
  total: number;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    padding: 32,
    backgroundColor: '#fff',
    color: '#222',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderBottom: '2px solid #eee',
    paddingBottom: 12,
  },
  logo: {
    width: 48,
    height: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  value: {
    marginBottom: 4,
  },
  table: {
    // @ts-expect-error - display: 'table' is not supported in react-pdf but needed for table layout
    display: 'table',
    width: 'auto',
    marginTop: 12,
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    fontWeight: 'bold',
    backgroundColor: '#f3f4f6',
    color: '#222',
    borderBottom: '1px solid #eee',
  },
  tableCell: {
    padding: 6,
    flexGrow: 1,
    fontSize: 12,
    borderBottom: '1px solid #eee',
  },
  totals: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  notes: {
    marginTop: 16,
    fontSize: 11,
    color: '#555',
  },
});

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoiceData, subtotal, taxAmount, total }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Image src={logo.src || logo} style={styles.logo}  />
        <View>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={styles.subtitle}>#{invoiceData.invoiceNumber}</Text>
        </View>
      </View>

      {/* Dates and Details */}
      <View style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.label}>Invoice Date:</Text>
            <Text style={styles.value}>{invoiceData.date}</Text>
          </View>
          <View>
            <Text style={styles.label}>Due Date:</Text>
            <Text style={styles.value}>{invoiceData.dueDate}</Text>
          </View>
        </View>
      </View>

      {/* From/To */}
      <View style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.label}>From:</Text>
            <Text style={styles.value}>{invoiceData.fromCompany || 'Your Company'}</Text>
            <Text style={styles.value}>{invoiceData.fromAddress}</Text>
            <Text style={styles.value}>{invoiceData.fromEmail}</Text>
            <Text style={styles.value}>{invoiceData.fromPhone}</Text>
          </View>
          <View>
            <Text style={styles.label}>Bill To:</Text>
            <Text style={styles.value}>{invoiceData.toCompany || 'Client Company'}</Text>
            <Text style={styles.value}>{invoiceData.toAddress}</Text>
            <Text style={styles.value}>{invoiceData.toEmail}</Text>
          </View>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, { flex: 3 }]}>Description</Text>
          <Text style={styles.tableCell}>Qty</Text>
          <Text style={styles.tableCell}>Rate</Text>
          <Text style={styles.tableCell}>Amount</Text>
        </View>
        {invoiceData.items.map((item: InvoiceItem) => (
          <View style={styles.tableRow} key={item.id}>
            <Text style={[styles.tableCell, { flex: 3 }]}>{item.description || 'Service description'}</Text>
            <Text style={styles.tableCell}>{item.quantity}</Text>
            <Text style={styles.tableCell}>${item.rate.toFixed(2)}</Text>
            <Text style={styles.tableCell}>${item.amount.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totals}>
        <Text>Subtotal: ${subtotal.toFixed(2)}</Text>
        <Text>Tax ({invoiceData.taxRate}%): ${taxAmount.toFixed(2)}</Text>
        <Text style={{ fontWeight: 'bold', fontSize: 14 }}>Total: ${total.toFixed(2)}</Text>
      </View>

      {/* Notes */}
      {invoiceData.notes && (
        <View style={styles.notes}>
          <Text>Notes: {invoiceData.notes}</Text>
        </View>
      )}
    </Page>
  </Document>
);

export default InvoicePDF; 