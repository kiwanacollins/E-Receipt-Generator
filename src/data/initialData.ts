import { ProductLine, Invoice } from './types'

export const initialProductLine: ProductLine = {
  description: '',
  quantity: '1',
  rate: '0', // Changed from '0.00' to '0'
}

export const initialInvoice: Invoice = {
  logo: '',
  logoWidth: 100,
  title: 'RECEIPT/INVOICE',
  companyName: '',
  name: '',
  companyAddress: '',
  companyAddress2: '',
  companyCountry: 'Uganda',
  billTo: 'Bill To:',
  clientName: '',
  clientContact: '', // Add this new field
  clientAddress: '',
  clientAddress2: '',
  clientCountry: 'Uganda',
  invoiceTitleLabel: 'Invoice#',
  invoiceTitle: '',
  invoiceDateLabel: 'Invoice Date',
  invoiceDate: '',
  invoiceDueDateLabel: 'Due Date',
  invoiceDueDate: '',
  productLineDescription: 'Item Description',
  productLineQuantity: 'Qantity',
  productLineQuantityRate: 'Rate',
  productLineQuantityAmount: 'Amount',
  productLines: [
    {
      description: 'Phone name',
      quantity: '2',
      rate: '100', // Changed from '100.00' to '100'
    },
    { ...initialProductLine },
    { ...initialProductLine },
  ],
  subTotalLabel: 'Sub Total',
  taxLabel: 'Sale Tax (10%)',
  totalLabel: 'TOTAL',
  currency: '$',
  notesLabel: 'Quality Service is our Priority',
  notes: 'We specialize in the sale and repair of original electronic devices, including mobile phones, computers, and iPads. Our services cover professional device repairs, software updates, programming, flashing, unlocking, phone accessories, and the supply of genuine mobile devices',
  termLabel: 'Terms & Conditions',
  term: 'Phone should not go beyond 3 Months in a repair centre. Your device is our dedication.',
  signature: '', // Initialize with empty string
  phoneImage1: '/apple-logo.png',
  phoneImage2: '/hp-logo.png',
}
