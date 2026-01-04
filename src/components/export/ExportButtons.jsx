// /src/components/export/ExportButtons.jsx
// Export buttons for PDF and HTML download
// Loads html2pdf.js dynamically for PDF generation
// RELEVANT FILES: src/lib/pdf-generator.js, src/pages/VisualBuilder.jsx

import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import {
  Download,
  FileText,
  Loader2,
  Printer,
  Copy,
  Check
} from 'lucide-react'
import {
  exportToPDF,
  downloadAsHTML,
  copyHTMLToClipboard,
  openForPrinting,
  estimatePageCount
} from '../../lib/pdf-generator'

// Load html2pdf.js dynamically
async function loadHtml2Pdf() {
  if (typeof window !== 'undefined' && !window.html2pdf) {
    // Load from CDN
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
}

export default function ExportButtons({
  product,
  profile,
  content,
  options = {},
  variant = 'full', // 'full' | 'compact' | 'icon-only'
  disabled = false
}) {
  const [exporting, setExporting] = useState(false)
  const [exportType, setExportType] = useState(null)
  const [copied, setCopied] = useState(false)
  const [html2pdfLoaded, setHtml2pdfLoaded] = useState(false)

  // Load html2pdf on mount
  useEffect(() => {
    loadHtml2Pdf()
      .then(() => setHtml2pdfLoaded(true))
      .catch(err => console.warn('Failed to load html2pdf:', err))
  }, [])

  const pageCount = estimatePageCount(content, options)

  // Export to PDF
  const handleExportPDF = async () => {
    setExporting(true)
    setExportType('pdf')

    try {
      await loadHtml2Pdf()
      await exportToPDF(product, profile, content, options)
    } catch (error) {
      console.error('PDF export failed:', error)
    } finally {
      setExporting(false)
      setExportType(null)
    }
  }

  // Export to HTML
  const handleExportHTML = () => {
    setExporting(true)
    setExportType('html')

    try {
      downloadAsHTML(product, profile, content, options)
    } finally {
      setTimeout(() => {
        setExporting(false)
        setExportType(null)
      }, 500)
    }
  }

  // Copy HTML
  const handleCopyHTML = async () => {
    const success = await copyHTMLToClipboard(product, profile, content, options)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Print
  const handlePrint = () => {
    openForPrinting(product, profile, content, options)
  }

  if (variant === 'icon-only') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleExportPDF}
          disabled={disabled || exporting}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          title="Download PDF"
        >
          {exporting && exportType === 'pdf' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={handleExportHTML}
          disabled={disabled || exporting}
          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
          title="Download HTML"
        >
          <FileText className="w-5 h-5" />
        </button>
        <button
          onClick={handlePrint}
          disabled={disabled}
          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
          title="Print"
        >
          <Printer className="w-5 h-5" />
        </button>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={handleExportPDF}
          disabled={disabled || exporting}
          variant="primary"
          className="text-sm"
        >
          {exporting && exportType === 'pdf' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </>
          )}
        </Button>
        <Button
          onClick={handleExportHTML}
          disabled={disabled || exporting}
          variant="secondary"
          className="text-sm"
        >
          <FileText className="w-4 h-4 mr-2" />
          HTML
        </Button>
      </div>
    )
  }

  // Full variant
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-2">Export Options</h3>
      <p className="text-sm text-gray-500 mb-4">
        Estimated {pageCount} page{pageCount !== 1 ? 's' : ''}
      </p>

      <div className="space-y-3">
        {/* PDF Download */}
        <Button
          onClick={handleExportPDF}
          disabled={disabled || exporting}
          variant="primary"
          className="w-full justify-center"
        >
          {exporting && exportType === 'pdf' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </>
          )}
        </Button>

        {/* HTML Download */}
        <Button
          onClick={handleExportHTML}
          disabled={disabled || exporting}
          variant="secondary"
          className="w-full justify-center"
        >
          {exporting && exportType === 'html' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Download HTML
            </>
          )}
        </Button>

        {/* Secondary actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleCopyHTML}
            disabled={disabled}
            variant="secondary"
            className="flex-1 justify-center text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copy HTML
              </>
            )}
          </Button>
          <Button
            onClick={handlePrint}
            disabled={disabled}
            variant="secondary"
            className="flex-1 justify-center text-sm"
          >
            <Printer className="w-4 h-4 mr-1" />
            Print
          </Button>
        </div>
      </div>

      {/* Export options info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
        <p className="font-medium mb-1">Includes:</p>
        <ul className="space-y-0.5">
          {options.includeCover !== false && <li>• Cover page</li>}
          <li>• Content ({content?.items?.length || content?.sections?.length || 0} items)</li>
          {options.includeReviewRequest !== false && <li>• Review request</li>}
          {options.includeCrossPromo && options.crossPromoText && <li>• Cross-promo</li>}
        </ul>
      </div>
    </div>
  )
}
