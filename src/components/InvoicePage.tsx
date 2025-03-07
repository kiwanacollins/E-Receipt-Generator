import { FC, useState, useEffect } from 'react'
import { Invoice, ProductLine } from '../data/types'
import { initialInvoice, initialProductLine } from '../data/initialData'
import EditableInput from './EditableInput'
import EditableSelect from './EditableSelect'
import EditableTextarea from './EditableTextarea'
import EditableCalendarInput from './EditableCalendarInput'
import EditableFileImage from './EditableFileImage'
import countryList from '../data/countryList'
import Document from './Document'
import Page from './Page'
import View from './View'
import Text from './Text'
import { Font } from '@react-pdf/renderer'
import Download from './DownloadPDF'
import { format } from 'date-fns/format'

Font.register({
  family: 'Nunito',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/nunito/v12/XRXV3I6Li01BKofINeaE.ttf' },
    {
      src: 'https://fonts.gstatic.com/s/nunito/v12/XRXW3I6Li01BKofA6sKUYevN.ttf',
      fontWeight: 600,
    },
  ],
})

interface Props {
  data?: Invoice
  pdfMode?: boolean
  onChange?: (invoice: Invoice) => void
}

const InvoicePage: FC<Props> = ({ data, pdfMode, onChange }) => {
  const [invoice, setInvoice] = useState<Invoice>(data ? { ...data } : { ...initialInvoice })
  const [subTotal, setSubTotal] = useState<number>()
  const [saleTax, setSaleTax] = useState<number>()

  const dateFormat = 'MMM dd, yyyy'
  const invoiceDate = invoice.invoiceDate !== '' ? new Date(invoice.invoiceDate) : new Date()
  const invoiceDueDate =
    invoice.invoiceDueDate !== ''
      ? new Date(invoice.invoiceDueDate)
      : new Date(invoiceDate.valueOf())

  if (invoice.invoiceDueDate === '') {
    invoiceDueDate.setDate(invoiceDueDate.getDate() + 30)
  }

  const handleChange = (name: keyof Invoice, value: string | number) => {
    if (name !== 'productLines') {
      const newInvoice = { ...invoice }

      if (name === 'logoWidth' && typeof value === 'number') {
        newInvoice[name] = value
      } else if (name !== 'logoWidth' && typeof value === 'string') {
        newInvoice[name] = value
      }

      setInvoice(newInvoice)
    }
  }

  const handleProductLineChange = (index: number, name: keyof ProductLine, value: string) => {
    const productLines = invoice.productLines.map((productLine, i) => {
      if (i === index) {
        const newProductLine = { ...productLine }

        if (name === 'description') {
          newProductLine[name] = value
        } else {
          if (
            value[value.length - 1] === '.' ||
            (value[value.length - 1] === '0' && value.includes('.'))
          ) {
            newProductLine[name] = value
          } else {
            const n = parseFloat(value)

            newProductLine[name] = (n ? n : 0).toString()
          }
        }

        return newProductLine
      }

      return { ...productLine }
    })

    setInvoice({ ...invoice, productLines })
  }

  const handleRemove = (i: number) => {
    const productLines = invoice.productLines.filter((_, index) => index !== i)

    setInvoice({ ...invoice, productLines })
  }

  const handleAdd = () => {
    const productLines = [...invoice.productLines, { ...initialProductLine }]

    setInvoice({ ...invoice, productLines })
  }

  const calculateAmount = (quantity: string, rate: string) => {
    const quantityNumber = parseFloat(quantity)
    const rateNumber = parseFloat(rate)
    const amount = quantityNumber && rateNumber ? quantityNumber * rateNumber : 0

    return amount.toFixed(2)
  }

  useEffect(() => {
    let subTotal = 0

    invoice.productLines.forEach((productLine) => {
      const quantityNumber = parseFloat(productLine.quantity)
      const rateNumber = parseFloat(productLine.rate)
      const amount = quantityNumber && rateNumber ? quantityNumber * rateNumber : 0

      subTotal += amount
    })

    setSubTotal(subTotal)
  }, [invoice.productLines])

  useEffect(() => {
    const match = invoice.taxLabel.match(/(\d+)%/)
    const taxRate = match ? parseFloat(match[1]) : 0
    const saleTax = subTotal ? (subTotal * taxRate) / 100 : 0

    setSaleTax(saleTax)
  }, [subTotal, invoice.taxLabel])

  useEffect(() => {
    if (onChange) {
      onChange(invoice)
    }
  }, [onChange, invoice])

  return (
    <Document pdfMode={pdfMode}>
      <Page className="invoice-wrapper" pdfMode={pdfMode}>
        {!pdfMode && <Download data={invoice} setData={(d) => setInvoice(d)} />}

        <View className="flex" pdfMode={pdfMode}>
          <View className="w-50" pdfMode={pdfMode}>
            <EditableFileImage
              className="logo"
              placeholder="Your Logo"
              value={invoice.logo} 
              width={invoice.logoWidth}
              pdfMode={pdfMode}
              onChangeImage={(value) => handleChange('logo', value)}
              onChangeWidth={(value) => handleChange('logoWidth', value)}
            />
            <EditableInput
              className="fs-20 bold"
              placeholder="Your Company"
              value={invoice.companyName}
              onChange={(value) => handleChange('companyName', value)}
              pdfMode={pdfMode}
            />
            {/* Other commented inputs */}
          </View>
          {/* Fixed the closing div to View */}
          <View className="w-50" pdfMode={pdfMode}>
            <EditableInput
              className="fs-45 right bold"
              placeholder="Receipt/Invoice"
              value={invoice.title}
              onChange={(value) => handleChange('title', value)}
              pdfMode={pdfMode}
            />
          </View>
        </View>

        <View className="flex mt-40" pdfMode={pdfMode}>
          <View className="w-55" pdfMode={pdfMode}>
            <EditableInput
              className="bold dark mb-5"
              // value={invoice.billTo}
              value='Clients Details'
              // onChange={(value) => handleChange('Sold To', value)}
              pdfMode={pdfMode}
            />
            <EditableInput
              placeholder="Your Client's Name"
              value={invoice.clientName}
              onChange={(value) => handleChange('clientName', value)}
              pdfMode={pdfMode}
            />
            <EditableInput
              placeholder="Client's Address"
              // value={invoice.clientAddress}
              value='Client Address'
              onChange={(value) => handleChange('clientAddress', value)}
              pdfMode={pdfMode}
            />
            {/* <EditableInput
              placeholder="City, State Zip"
              value={invoice.clientAddress2}
              onChange={(value) => handleChange('clientAddress2', value)}
              pdfMode={pdfMode}
            /> */}
            <EditableSelect
              options={countryList}
              value={invoice.clientCountry}
              onChange={(value) => handleChange('clientCountry', value)}
              pdfMode={pdfMode}
            />
          </View>
          <View className="w-45" pdfMode={pdfMode}>
            <View className="flex mb-5" pdfMode={pdfMode}>
              {/* <View className="w-40" pdfMode={pdfMode}>
                <EditableInput
                  className="bold"
                  value={invoice.invoiceTitleLabel}
                  onChange={(value) => handleChange('invoiceTitleLabel', value)}
                  pdfMode={pdfMode}
                />
              </View> */}
              <View className="w-60" pdfMode={pdfMode}>
                {/* <EditableInput
                  placeholder="INV-12"
                  value={invoice.invoiceTitle}
                  onChange={(value) => handleChange('invoiceTitle', value)}
                  pdfMode={pdfMode}
                /> */}
              </View>
            </View>
            <View className="flex mb-5" pdfMode={pdfMode}>
              <View className="w-40" pdfMode={pdfMode}>
                <EditableInput
                  className="bold"
                  // value={invoice.invoiceDateLabel}
                  value='Date'
                  // onChange={(value) => handleChange('invoiceDateLabel', value)}
                  pdfMode={pdfMode}
                />
              </View>
              <View className="w-60" pdfMode={pdfMode}>
                <EditableCalendarInput
                  value={format(invoiceDate, dateFormat)}
                  selected={invoiceDate}
                  onChange={(date) =>
                    handleChange(
                      'invoiceDate',
                      date && !Array.isArray(date) ? format(date, dateFormat) : '',
                    )
                  }
                  pdfMode={pdfMode}
                />
              </View>
            </View>
            <View className="flex mb-5" pdfMode={pdfMode}>
              {/* <View className="w-40" pdfMode={pdfMode}>
                <EditableInput
                  className="bold"
                  value={invoice.invoiceDueDateLabel}
                  onChange={(value) => handleChange('invoiceDueDateLabel', value)}
                  pdfMode={pdfMode}
                />
              </View> */}
              {/* <View className="w-60" pdfMode={pdfMode}>
                <EditableCalendarInput
                  value={format(invoiceDueDate, dateFormat)}
                  selected={invoiceDueDate}
                  onChange={(date) =>
                    handleChange(
                      'invoiceDueDate',
                      date ? (!Array.isArray(date) ? format(date, dateFormat) : '') : '',
                    )
                  }
                  pdfMode={pdfMode}
                />
              </View> */}
            </View>
          </View>
        </View>

        <View className="mt-30 bg-dark flex" pdfMode={pdfMode}>
          <View className="w-48 p-4-8" pdfMode={pdfMode}>
            <EditableInput
              className="white bold"
              value={invoice.productLineDescription}
              // onChange={(value) => handleChange('productLineDescription', value)}
              pdfMode={pdfMode}
            />
          </View>
          <View className="w-17 p-4-8" pdfMode={pdfMode}>
            <EditableInput
              className="white bold right"
              value='Quantity'
              // onChange={(value) => handleChange('productLineQuantity', value)}
              pdfMode={pdfMode}
            />
          </View>
          <View className="w-17 p-4-8" pdfMode={pdfMode}>
            <EditableInput
              className="white bold right"
              value={invoice.productLineQuantityRate}
              // onChange={(value) => handleChange('productLineQuantityRate', value)}
              pdfMode={pdfMode}
            />
          </View>
          <View className="w-18 p-4-8" pdfMode={pdfMode}>
            <EditableInput
              className="white bold right"
              value={invoice.productLineQuantityAmount}
              // onChange={(value) => handleChange('productLineQuantityAmount', value)}
              pdfMode={pdfMode}
            />
          </View>
        </View>

        {invoice.productLines.map((productLine, i) => {
          return pdfMode && productLine.description === '' ? (
            <Text key={i}></Text>
          ) : (
            <View key={i} className="row flex" pdfMode={pdfMode}>
              <View className="w-48 p-4-8 pb-10" pdfMode={pdfMode}>
                <EditableTextarea
                  className="dark"
                  rows={2}
                  placeholder="Enter item name/description"
                  value={productLine.description}
                  onChange={(value) => handleProductLineChange(i, 'description', value)}
                  pdfMode={pdfMode}
                />
              </View>
              <View className="w-17 p-4-8 pb-10" pdfMode={pdfMode}>
                <EditableInput
                  className="dark right"
                  value={productLine.quantity}
                  onChange={(value) => handleProductLineChange(i, 'quantity', value)}
                  pdfMode={pdfMode}
                />
              </View>
              <View className="w-17 p-4-8 pb-10" pdfMode={pdfMode}>
                <EditableInput
                  className="dark right"
                  value={productLine.rate}
                  onChange={(value) => handleProductLineChange(i, 'rate', value)}
                  pdfMode={pdfMode}
                />
              </View>
              <View className="w-18 p-4-8 pb-10" pdfMode={pdfMode}>
                <Text className="dark right" pdfMode={pdfMode}>
                  {calculateAmount(productLine.quantity, productLine.rate)}
                </Text>
              </View>
              {!pdfMode && (
                <button
                  className="link row__remove"
                  aria-label="Remove Row"
                  title="Remove Row"
                  onClick={() => handleRemove(i)}
                >
                  <span className="icon icon-remove bg-red"></span>
                </button>
              )}
            </View>
          )
        })}

        <View className="flex" pdfMode={pdfMode}>
          <View className="w-50 mt-10" pdfMode={pdfMode}>
            {!pdfMode && (
              <button className="link" onClick={handleAdd}>
                <span className="icon icon-add bg-green mr-10"></span>
                Add Line Item
              </button>
            )}
          </View>
          <View className="w-50 mt-20" pdfMode={pdfMode}>
            {/* <View className="flex" pdfMode={pdfMode}>
              <View className="w-50 p-5" pdfMode={pdfMode}>
                <EditableInput
                  value={invoice.subTotalLabel}
                  // onChange={(value) => handleChange('subTotalLabel', value)}
                  pdfMode={pdfMode}
                />
              </View>
              <View className="w-50 p-5" pdfMode={pdfMode}>
                <Text className="right bold dark" pdfMode={pdfMode}>
                  {subTotal?.toFixed(2)}
                </Text>
              </View>
            </View> */}
            {/* <View className="flex" pdfMode={pdfMode}>
              <View className="w-50 p-5" pdfMode={pdfMode}>
                <EditableInput
                  value={invoice.taxLabel}
                  onChange={(value) => handleChange('taxLabel', value)}
                  pdfMode={pdfMode}
                />
              </View>
              <View className="w-50 p-5" pdfMode={pdfMode}>
                <Text className="right bold dark" pdfMode={pdfMode}>
                  {saleTax?.toFixed(2)}
                </Text>
              </View>
            </View> */}
            <View className="flex bg-gray p-5" pdfMode={pdfMode}>
              <View className="w-50 p-5" pdfMode={pdfMode}>
                <EditableInput
                  className="bold"
                  value={invoice.totalLabel}
                  // onChange={(value) => handleChange('totalLabel', value)}
                  pdfMode={pdfMode}
                />
              </View>
              <View className="w-50 p-5 flex" pdfMode={pdfMode}>
                <EditableInput
                  className="dark bold right ml-60"
                  // value={invoice.currency}
                  value='UGX'
                  // onChange={(value) => handleChange('currency', value)}
                  pdfMode={pdfMode}
                />
                <Text className="right bold dark w-auto" pdfMode={pdfMode}>
                  {(typeof subTotal !== 'undefined' && typeof saleTax !== 'undefined'
                    ? subTotal
                    : 0
                  ).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-20" pdfMode={pdfMode}>
          <Text className="bold mb-5 fs-16" pdfMode={pdfMode}>Quality Service is our Priority</Text>
          <Text className="mb-10 fs-12" pdfMode={pdfMode}>
            Dealers in all kinds of Electronics, Mobile Phones Repairs, Computer Services, Ipads,
            Programming, Software updates,
            Phone accessories, flashing and unlocking and Sales of all Mobile Phones.
          </Text>
        </View>
        
        <View className="mt-20" pdfMode={pdfMode}>
          <Text className="bold mb-5 fs-16" pdfMode={pdfMode}>Terms and Conditions</Text>
          <Text className="fs-12" pdfMode={pdfMode}>
            Phone should not go beyond 3 Months in a repair centre.
          </Text>
          <Text className="mb-10 fs-12" pdfMode={pdfMode}>
            NOTE: Your device is our dedication.
          
          </Text>
        </View>
                    <hr />
        <View className="mt-20" pdfMode={pdfMode}>
          <View className="border-top mb-10" pdfMode={pdfMode}/>
          
          <View className="flex" pdfMode={pdfMode}>
            <View className="flex-1" pdfMode={pdfMode}>
              <Text className="bold fs-12" pdfMode={pdfMode}>
                Plot 13, Kampala,{'\n'}Amadinda House
              </Text>
            </View>
            <View className="flex-1" pdfMode={pdfMode}>
              <Text className="bold fs-12 center" pdfMode={pdfMode}>
                Tel:{'\n'}+256 200 933 371{'\n'}+256 706 395 757{'\n'}256 772 560 792
              </Text>
            </View>
            <View className="flex-1" pdfMode={pdfMode}>
              <Text className="bold fs-12 right" pdfMode={pdfMode}>
                P.O.BOX 34338{'\n'}Kampala Uganda
              </Text>
            </View>
          </View>
    
          
          {/* BT REPAIR SIGNATURE IMAGE INSERTION WITH A BOX AROUND IT */}
          <View 
            className="signature-container border-box mt-20 max-width-300" 
            pdfMode={pdfMode}
          >
            <Text 
              className="bold mb-5 signature-title"
              pdfMode={pdfMode}
            >
              Authorized Signature
            </Text>
            
            <View className="height-60" pdfMode={pdfMode}>
              <EditableFileImage
                className="signature-image"
                placeholder="BT Repair Signature"
                value={invoice.signature || ''}
                width={150}
                pdfMode={pdfMode}
                onChangeImage={(value) => handleChange('signature', value)}
                onChangeWidth={(value) => {/* Ignore width changes for signature */}}
              />
            </View>
            
            <Text 
              className="mt-5 italic signature-name"
              pdfMode={pdfMode}
            >
              {/* BT Repair */}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export default InvoicePage
