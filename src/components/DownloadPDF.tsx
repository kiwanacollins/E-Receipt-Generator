import { FC } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { Invoice } from '../data/types'
import { useDebounce } from '@uidotdev/usehooks'
import InvoicePage from './InvoicePage'

interface Props {
  data: Invoice
  setData(data: Invoice): void
}

const Download: FC<Props> = ({ data }) => {
  const debounced = useDebounce(data, 500)

  return (
    <div className={'download-pdf '}>
      <PDFDownloadLink
        key="pdf"
        document={<InvoicePage pdfMode={true} data={debounced} />}
        fileName={`Reciept.pdf`}
        aria-label="Save PDF"
        title="Save PDF"
        className="download-pdf__pdf"
      ></PDFDownloadLink>
      <p>Save PDF</p>

      {/* <button
        onClick={handleSaveTemplate}
        aria-label="Save Template"
        title="Save Template"
        className="download-pdf__template_download mt-40"
      /> */}
      {/* <p className="text-small">Save Template</p> */}

      {/* <label className="download-pdf__template_upload">
        <input type="file" accept=".json,.template" onChange={handleInput} />
      </label> */}
      {/* <p className="text-small">Upload Template</p> */}
    </div>
  )
}

export default Download
