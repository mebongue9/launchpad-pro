// /src/templates/formats/cheat-sheet.js
// Cheat sheet format template for quick reference one-pagers
// Used for condensed, scannable information
// RELEVANT FILES: src/templates/formats/index.js, src/pages/VisualBuilder.jsx

export const cheatSheetTemplate = {
  id: 'cheat-sheet',
  name: 'Cheat Sheet',
  description: 'Quick reference one-pager with key information',
  icon: '📄',

  // Generate HTML structure for a cheat sheet page
  generateHTML: (content, style = {}) => {
    const sections = content.sections || [];
    const { fontFamily, primaryColor, backgroundColor } = style;

    return `
      <div class="cheat-sheet-page" style="
        font-family: ${fontFamily || 'system-ui, sans-serif'};
        background: ${backgroundColor || '#ffffff'};
        padding: 32px;
        max-width: 900px;
        margin: 0 auto;
      ">
        <div style="
          text-align: center;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 3px solid ${primaryColor || '#3b82f6'};
        ">
          <h1 style="
            color: ${primaryColor || '#1a1a1a'};
            font-size: 32px;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          ">${content.title || 'Cheat Sheet'}</h1>
          ${content.subtitle ? `
            <p style="color: #666; font-size: 16px;">
              ${content.subtitle}
            </p>
          ` : ''}
        </div>

        <div style="
          display: grid;
          grid-template-columns: repeat(${content.columns || 2}, 1fr);
          gap: 24px;
        ">
          ${sections.map((section, i) => `
            <div class="section" style="
              background: #f9fafb;
              border-radius: 12px;
              padding: 20px;
              border-top: 4px solid ${section.color || primaryColor || '#3b82f6'};
            ">
              <h3 style="
                font-size: 16px;
                font-weight: 700;
                color: ${section.color || primaryColor || '#3b82f6'};
                margin-bottom: 12px;
                text-transform: uppercase;
                letter-spacing: 0.03em;
              ">${section.title || `Section ${i + 1}`}</h3>

              <ul style="
                list-style: none;
                padding: 0;
                margin: 0;
              ">
                ${(section.items || []).map(item => `
                  <li style="
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    margin-bottom: 8px;
                    color: #374151;
                    font-size: 14px;
                    line-height: 1.5;
                  ">
                    <span style="color: ${section.color || primaryColor || '#3b82f6'};">•</span>
                    ${typeof item === 'string' ? item : item.text}
                  </li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
        </div>

        ${content.footer ? `
          <div style="
            margin-top: 32px;
            padding: 20px;
            background: linear-gradient(90deg, ${primaryColor || '#3b82f6'}10, ${primaryColor || '#3b82f6'}05);
            border-radius: 12px;
            text-align: center;
          ">
            <p style="color: #4b5563; font-size: 14px;">
              ${content.footer}
            </p>
          </div>
        ` : ''}
      </div>
    `;
  },

  // React component for preview
  PreviewComponent: ({ content, style }) => {
    const sections = content?.sections || [];

    // Static class mapping for Tailwind JIT compatibility
    const columnClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4'
    };
    const gridColsClass = columnClasses[content?.columns] || 'grid-cols-2';

    return (
      <div className="cheat-sheet-preview p-6">
        <div className="text-center mb-8 pb-6 border-b-4 border-blue-600">
          <h2 className="text-3xl font-bold uppercase tracking-wide mb-2">
            {content?.title || 'Cheat Sheet'}
          </h2>
          {content?.subtitle && (
            <p className="text-gray-600">{content.subtitle}</p>
          )}
        </div>

        <div className={`grid ${gridColsClass} gap-6`}>
          {sections.map((section, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-xl p-5 border-t-4"
              style={{ borderColor: section.color || '#3b82f6' }}
            >
              <h3
                className="text-base font-bold uppercase tracking-wide mb-3"
                style={{ color: section.color || '#3b82f6' }}
              >
                {section.title || `Section ${i + 1}`}
              </h3>
              <ul className="space-y-2">
                {(section.items || []).map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-gray-700 text-sm">
                    <span style={{ color: section.color || '#3b82f6' }}>•</span>
                    {typeof item === 'string' ? item : item.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {content?.footer && (
          <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-blue-25 rounded-xl text-center">
            <p className="text-gray-600 text-sm">{content.footer}</p>
          </div>
        )}
      </div>
    );
  }
};

export default cheatSheetTemplate;
