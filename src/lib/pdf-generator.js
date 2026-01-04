// /src/lib/pdf-generator.js
// PDF and HTML export functionality for products
// Combines: Cover → Content → Review Request → Cross-Promo
// Uses html2pdf.js for client-side PDF generation
// RELEVANT FILES: src/pages/VisualBuilder.jsx, src/templates/cover.js, src/templates/review-request.js

import { generateCoverHTML } from '../templates/cover.jsx';
import { generateReviewRequestHTML } from '../templates/review-request.jsx';
import { generateFormatHTML } from '../templates/formats/index.jsx';
import { getStyle } from '../templates/styles/index.js';

// ==============================================
// HTML DOCUMENT GENERATION
// ==============================================

// Generate complete HTML document for a product
export function generateCompleteHTML(product, profile, content, options = {}) {
  const {
    styleId = 'apple-minimal',
    formatId = 'checklist',
    includeCover = true,
    includeReviewRequest = true,
    includeCrossPromo = true,
    crossPromoText = null
  } = options;

  const style = getStyle(styleId)?.css || {};

  // Build HTML sections
  const sections = [];

  // 1. Cover Page
  if (includeCover) {
    sections.push(generateCoverHTML(product, profile, style));
    sections.push('<div class="page-break"></div>');
  }

  // 2. Content Pages (using format template)
  sections.push(generateFormatHTML(formatId, content, style));

  // 3. Review Request
  if (includeReviewRequest) {
    sections.push('<div class="page-break"></div>');
    sections.push(generateReviewRequestHTML(profile, style));
  }

  // 4. Cross-Promo (if provided)
  if (includeCrossPromo && crossPromoText) {
    sections.push('<div class="page-break"></div>');
    sections.push(generateCrossPromoHTML(crossPromoText, profile, style));
  }

  // Wrap in complete HTML document
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${style.fontFamily || '-apple-system, BlinkMacSystemFont, sans-serif'};
      line-height: ${style.lineHeight || '1.6'};
      color: ${style.primaryColor || '#1a1a1a'};
    }

    .page-break {
      page-break-after: always;
      break-after: page;
    }

    @media print {
      .page-break {
        page-break-after: always;
      }
    }

    /* Reset for export */
    @page {
      margin: 0;
      size: A4;
    }
  </style>
</head>
<body>
  ${sections.join('\n')}
</body>
</html>
  `.trim();
}

// Generate cross-promo section HTML
function generateCrossPromoHTML(text, profile, style = {}) {
  const {
    fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif',
    primaryColor = '#1a1a1a',
    accentColor = '#3b82f6'
  } = style;

  return `
    <div class="cross-promo-page" style="
      font-family: ${fontFamily};
      background: linear-gradient(135deg, ${accentColor}10 0%, ${accentColor}05 100%);
      padding: 60px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
    ">
      <div style="
        max-width: 600px;
        margin: 0 auto;
        text-align: center;
      ">
        <h2 style="
          font-size: 28px;
          font-weight: 700;
          color: ${primaryColor};
          margin-bottom: 24px;
        ">Ready for the Next Level?</h2>

        <div style="
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          text-align: left;
        ">
          <p style="
            font-size: 16px;
            color: ${primaryColor};
            line-height: 1.8;
          ">${text}</p>
        </div>

        ${profile.social_handle ? `
          <p style="
            margin-top: 24px;
            color: ${accentColor};
            font-weight: 500;
          ">Follow me: ${profile.social_handle}</p>
        ` : ''}
      </div>
    </div>
  `;
}

// ==============================================
// PDF EXPORT (using html2pdf.js)
// ==============================================

// Export to PDF using html2pdf.js
export async function exportToPDF(product, profile, content, options = {}) {
  const html = generateCompleteHTML(product, profile, content, options);

  // Check if html2pdf is available
  if (typeof window !== 'undefined' && window.html2pdf) {
    const element = document.createElement('div');
    element.innerHTML = html;
    document.body.appendChild(element);

    const pdfOptions = {
      margin: 0,
      filename: `${product.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await window.html2pdf().set(pdfOptions).from(element).save();
    } finally {
      document.body.removeChild(element);
    }

    return true;
  }

  // Fallback: download as HTML and print to PDF
  console.warn('html2pdf not available, using HTML download fallback');
  downloadAsHTML(product, profile, content, options);
  return false;
}

// ==============================================
// HTML EXPORT
// ==============================================

// Download as HTML file
export function downloadAsHTML(product, profile, content, options = {}) {
  const html = generateCompleteHTML(product, profile, content, options);

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${product.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

// Copy HTML to clipboard
export async function copyHTMLToClipboard(product, profile, content, options = {}) {
  const html = generateCompleteHTML(product, profile, content, options);

  try {
    await navigator.clipboard.writeText(html);
    return true;
  } catch (error) {
    console.error('Failed to copy HTML:', error);
    return false;
  }
}

// Open HTML in new window for printing
export function openForPrinting(product, profile, content, options = {}) {
  const html = generateCompleteHTML(product, profile, content, options);

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

// Get estimated page count
export function estimatePageCount(content, options = {}) {
  const { includeCover = true, includeReviewRequest = true, includeCrossPromo = false } = options;

  let pages = 0;

  if (includeCover) pages += 1;
  if (includeReviewRequest) pages += 1;
  if (includeCrossPromo) pages += 1;

  // Estimate content pages based on sections/items
  if (content.sections) {
    pages += Math.ceil(content.sections.length / 2); // ~2 sections per page
  } else if (content.items) {
    pages += Math.ceil(content.items.length / 10); // ~10 items per page
  } else if (content.steps) {
    pages += Math.ceil(content.steps.length / 3); // ~3 steps per page
  } else {
    pages += 2; // Default estimate
  }

  return pages;
}

export default {
  generateCompleteHTML,
  exportToPDF,
  downloadAsHTML,
  copyHTMLToClipboard,
  openForPrinting,
  estimatePageCount
};
