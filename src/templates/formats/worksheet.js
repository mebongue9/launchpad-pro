// /src/templates/formats/worksheet.js
// Worksheet format template with fill-in sections and prompts
// Used for guided exercises and reflection
// RELEVANT FILES: src/templates/formats/index.js, src/pages/VisualBuilder.jsx

export const worksheetTemplate = {
  id: 'worksheet',
  name: 'Worksheet',
  description: 'Fill-in sections with guiding prompts',
  icon: '📝',

  // Generate HTML structure for a worksheet page
  generateHTML: (content, style = {}) => {
    const sections = content.sections || [];
    const { fontFamily, primaryColor, backgroundColor } = style;

    return `
      <div class="worksheet-page" style="
        font-family: ${fontFamily || 'system-ui, sans-serif'};
        background: ${backgroundColor || '#ffffff'};
        padding: 40px;
        max-width: 800px;
        margin: 0 auto;
      ">
        <h1 style="
          color: ${primaryColor || '#1a1a1a'};
          font-size: 28px;
          margin-bottom: 8px;
        ">${content.title || 'Worksheet'}</h1>

        ${content.subtitle ? `
          <p style="color: #666; font-size: 16px; margin-bottom: 32px;">
            ${content.subtitle}
          </p>
        ` : ''}

        <div class="sections" style="display: flex; flex-direction: column; gap: 32px;">
          ${sections.map((section, i) => `
            <div class="section" style="
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 24px;
              background: #fafafa;
            ">
              <h3 style="
                color: ${primaryColor || '#1a1a1a'};
                font-size: 18px;
                margin-bottom: 8px;
              ">${section.title || `Section ${i + 1}`}</h3>

              ${section.prompt ? `
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px; font-style: italic;">
                  ${section.prompt}
                </p>
              ` : ''}

              <div style="
                min-height: ${section.lines ? section.lines * 32 : 120}px;
                background: #ffffff;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                padding: 16px;
              ">
                ${Array(section.lines || 4).fill().map(() => `
                  <div style="
                    height: 28px;
                    border-bottom: 1px solid #e5e7eb;
                  "></div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // React component for preview
  PreviewComponent: ({ content, style }) => {
    const sections = content?.sections || [];

    return (
      <div className="worksheet-preview p-6">
        <h2 className="text-2xl font-bold mb-2">{content?.title || 'Worksheet'}</h2>
        {content?.subtitle && (
          <p className="text-gray-600 mb-6">{content.subtitle}</p>
        )}
        <div className="space-y-6">
          {sections.map((section, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
              <h3 className="text-lg font-semibold mb-2">{section.title || `Section ${i + 1}`}</h3>
              {section.prompt && (
                <p className="text-sm text-gray-500 italic mb-4">{section.prompt}</p>
              )}
              <div className="bg-white border border-gray-300 rounded-lg p-4 min-h-[120px]">
                {Array(section.lines || 4).fill().map((_, j) => (
                  <div key={j} className="h-7 border-b border-gray-200 last:border-0" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

export default worksheetTemplate;
