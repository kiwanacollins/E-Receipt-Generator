import { FC, useState, useEffect } from 'react'
import { Invoice, ProductLine } from '../data/types'
import { initialInvoice, initialProductLine } from '../data/initialData'
import EditableInput from './EditableInput'
import EditableTextarea from './EditableTextarea'
import EditableCalendarInput from './EditableCalendarInput'
// Fix Document import - ensure it's correctly imported
import MyDocument from './Document'
import Page from './Page'
import View from './View'
import Text from './Text'
import { Font, Image } from '@react-pdf/renderer'
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
  const dateFormat = 'dd MMM yyyy'
  const todayFormatted = format(new Date(), dateFormat)

  const [invoice, setInvoice] = useState<Invoice>(() => {
    const base = data ? { ...data } : { ...initialInvoice }
    if (!base.invoiceDate) base.invoiceDate = todayFormatted
    return base
  })
  const [subTotal, setSubTotal] = useState<number>()
  const [saleTax, setSaleTax] = useState<number>()

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

    // Return as a whole number without decimals
    return Math.round(amount).toString()
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

  // Function to convert numbers to words - fixed to handle hundreds correctly
  const convertNumberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 
                'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 
                'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    function convertLessThanOneThousand(num: number): string {
      if (num === 0) return '';
      
      if (num < 20) {
        return ones[num];
      }
      
      if (num < 100) {
        const ten = Math.floor(num / 10);
        const one = num % 10;
        return tens[ten] + (one > 0 ? '-' + ones[one] : '');
      }
      
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      
      return ones[hundred] + ' Hundred' + (remainder > 0 ? ' ' + convertLessThanOneThousand(remainder) : '');
    }
    
    let words = '';
    const billion = Math.floor(num / 1000000000);
    const million = Math.floor((num % 1000000000) / 1000000);
    const thousand = Math.floor((num % 1000000) / 1000);
    const remainder = num % 1000;
    
    if (billion) {
      words += convertLessThanOneThousand(billion) + ' Billion ';
    }
    
    if (million) {
      words += convertLessThanOneThousand(million) + ' Million ';
    }
    
    if (thousand) {
      words += convertLessThanOneThousand(thousand) + ' Thousand ';
    }
    
    if (remainder || words === '') {
      words += convertLessThanOneThousand(remainder);
    }
    
    return words.trim();
  };

  return (
    <MyDocument pdfMode={pdfMode}>
      <Page className="invoice-wrapper" pdfMode={pdfMode}>
        {!pdfMode && <Download data={invoice} setData={(d) => setInvoice(d)} />}

        <View className="flex header-flex" pdfMode={pdfMode}>
          <View className="w-50" pdfMode={pdfMode}>
            {pdfMode ? (
              <Image src="/bt-prepair-logo.png" style={{ width: '100px' }} />
            ) : (
              <img src="/bt-prepair-logo.png" alt="BT Repair Logo" style={{ maxWidth: '100px', display: 'block' }} />
            )}
            <Text 
              className="bold fs-20 red"
              pdfMode={pdfMode}
            >
              BT REPAIR CENTRE
            </Text>

            {/* Other commented inputs */}
          </View>

          {/* Fixed the closing div to View */}
          <View className="w-50" pdfMode={pdfMode}>
            <Text className="fs-45 right bold" pdfMode={pdfMode}>
              RECEIPT/INVOICE
            </Text>

            
          <View className="mt-10" pdfMode={pdfMode}></View>
            <Text className="bold mb-5" pdfMode={pdfMode}>
              {/* Phone Images */}
            </Text>
            <View className="flex" pdfMode={pdfMode}>
              <View className="w-50 pr-10" pdfMode={pdfMode}>
                {pdfMode ? (
                  invoice.phoneImage1 ? (
                    <Image src={invoice.phoneImage1} style={{ width: '100px', maxHeight: '100px' }} />
                  ) : null
                ) : (
                  invoice.phoneImage1 ? (
                    <img
                      src={invoice.phoneImage1}
                      alt="Phone Brand 1"
                      style={{ maxWidth: '160px', maxHeight: '100px', display: 'block' }}
                    />
                  ) : null
                )}
              </View>
              <View className="w-50" pdfMode={pdfMode}>
                {pdfMode ? (
                  invoice.phoneImage2 ? (
                    <Image src={invoice.phoneImage2} style={{ width: '100px', maxHeight: '100px' }} />
                  ) : null
                ) : (
                  invoice.phoneImage2 ? (
                    <img
                      src={invoice.phoneImage2}
                      alt="Phone Brand 2"
                      style={{ maxWidth: '160px', maxHeight: '100px', display: 'block' }}
                    />
                  ) : null
                )}
              </View>
            </View>

          </View>
        </View>

        <View className="mt-10" pdfMode={pdfMode}>
          <Text className="bold mb-5 fs-16 red" pdfMode={pdfMode}>Quality Service is our Priority</Text>
          <Text className="mb-10 fs-12" pdfMode={pdfMode}>
            We specialize in the sale and repair of original electronic devices, including mobile phones, computers, and iPads. Our services cover professional device repairs, software updates, programming, flashing, unlocking, phone accessories, and the supply of genuine mobile devices.
          </Text>
        </View>

        <View className="flex mt-40" pdfMode={pdfMode}>
          <View className="w-55" pdfMode={pdfMode}>
            <Text 
              className="bold mb-5 signature-title"
              pdfMode={pdfMode}
            >
              Name
            </Text>
            <EditableInput
              placeholder="Client's Name"
              value={invoice.clientName}
              onChange={(value) => handleChange('clientName', value)}
              pdfMode={pdfMode}
            />

              <Text 
              className="bold mb-5 signature-title"
              pdfMode={pdfMode}
            >
              Phone Number
            </Text>
            <EditableInput
              placeholder="Client's Contact"
              value={invoice.clientContact}
              onChange={(value) => handleChange('clientContact', value)}
              pdfMode={pdfMode}
            />
             <Text 
              className="bold mb-5 signature-title"
              pdfMode={pdfMode}
            >
             Client Address
            </Text>
           
            <EditableInput
              placeholder="Client's Address"
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
                 <Text 
              className="bold mb-5 signature-title"
              pdfMode={pdfMode}
            >
             Date
            </Text>
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

        <View className="mt-30 bg-blue flex" pdfMode={pdfMode}>
          <View className="w-48 p-4-8" pdfMode={pdfMode}>
             <Text 
              className="bold mb-5 white"
              pdfMode={pdfMode}
            >
              Product Description
            </Text>
          </View>
          <View className="w-17 p-4-8" pdfMode={pdfMode}>
            <Text 
              className="bold mb-5 white"
              pdfMode={pdfMode}
            >
              Quantity
            </Text>
          </View>
          <View className="w-17 p-4-8" pdfMode={pdfMode}>
            <Text 
              className="bold mb-5 white"
              pdfMode={pdfMode}
            >
             Rate
            </Text>
          </View>
          <View className="w-18 p-4-8" pdfMode={pdfMode}>
            <Text 
              className="bold mb-5 white"
              pdfMode={pdfMode}
            >
             Amount
            </Text>
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
                <Text 
              className="bold mb-5"
              pdfMode={pdfMode}
            >
             Total
            </Text>
              </View>
              <View className="w-50 p-5 flex" pdfMode={pdfMode}>
                <Text 
              className="bold mb-5"
              pdfMode={pdfMode}
            >
             UGX
            </Text>
                <Text className="right bold dark w-auto" pdfMode={pdfMode}>
                  {(typeof subTotal !== 'undefined' && typeof saleTax !== 'undefined'
                    ? Math.round(subTotal)
                    : 0
                  ).toString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Add the amount in words section */}
        <View className="mt-10" pdfMode={pdfMode}>
          <Text className="bold mb-5" pdfMode={pdfMode}>Amount in words:</Text>
          <Text className="mb-10" pdfMode={pdfMode}>
            {`${convertNumberToWords(typeof subTotal !== 'undefined' ? Math.round(subTotal) : 0)} Uganda Shillings Only`}
          </Text>
        </View>
        <hr />
        
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
              <Text className="bold fs-12" pdfMode={pdfMode}>Plot 13, Kampala,</Text>
              <Text className="bold fs-12" pdfMode={pdfMode}>Amadinda House</Text>
            </View>
             <View className="flex-1" pdfMode={pdfMode}>
              <Text className="bold fs-12 right" pdfMode={pdfMode}>P.O.BOX 34338</Text>
              <Text className="bold fs-12 right" pdfMode={pdfMode}>Kampala Uganda</Text>
            </View>
            <View className="flex-1" pdfMode={pdfMode}>
              <View className="border-top mb-5" pdfMode={pdfMode}/>
              <Text className="bold fs-16 center" pdfMode={pdfMode}>Tel:</Text>
               <Text className="bold fs-12 center" pdfMode={pdfMode}>256 772 560 792</Text>
               <Text className="bold fs-12 center" pdfMode={pdfMode}>+256 702 560 792</Text>
              <Text className="bold fs-12 center" pdfMode={pdfMode}>+256 200 933 371</Text>
            
             
            </View>
           
          </View>
    
          <View 
            className="signature-container border-box mt-n5 max-width-300"
            pdfMode={pdfMode}
          >
            <Text 
              className="bold mb-5 signature-title"
              pdfMode={pdfMode}
            >
              Authorized Signature
            </Text>
            
            <View className="height-60" pdfMode={pdfMode}>
              {pdfMode ? (
                <Image src="/bt-signature.png" style={{ width: '360px', maxHeight: '360px' }} />
              ) : (
                <img src="/bt-signature.png" alt="BT Repair Signature" style={{ maxWidth: '350px', maxHeight: '100px', display: 'block' }} />
              )}
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
    </MyDocument>
  )
}

export default InvoicePage
