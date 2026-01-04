// /src/templates/formats/checklist.js
// Checklist format template with checkbox items and notes column
// Used for step-by-step action items
// RELEVANT FILES: src/templates/formats/index.js, src/pages/VisualBuilder.jsx

export const checklistTemplate = {
  id: 'checklist',
  name: 'Checklist',
  description: 'Checkbox items with optional notes column',
  icon: '☑️',

  // Generate HTML structure for a checklist page
  generateHTML: (content, style = {}) => {
    const items = content.items || [];
    const { fontFamily, primaryColor, backgroundColor } = style;

    return `
      <div class="checklist-page" style="
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
        ">${content.title || 'Checklist'}</h1>

        ${content.subtitle ? `
          <p style="color: #666; font-size: 16px; margin-bottom: 32px;">
            ${content.subtitle}
          </p>
        ` : ''}

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="
                text-align: left;
                padding: 12px 16px;
                background: ${primaryColor || '#f3f4f6'};
                color: ${primaryColor ? '#fff' : '#374151'};
                font-weight: 600;
                width: 60%;
              ">Action Item</th>
              <th style="
                text-align: left;
                padding: 12px 16px;
                background: ${primaryColor || '#f3f4f6'};
                color: ${primaryColor ? '#fff' : '#374151'};
                font-weight: 600;
                width: 40%;
              ">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, i) => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 16px;">
                  <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer;">
                    <input type="checkbox" style="
                      width: 20px;
                      height: 20px;
                      margin-top: 2px;
                      accent-color: ${primaryColor || '#3b82f6'};
                    " />
                    <span style="color: #374151; line-height: 1.5;">
                      ${item.text || item}
                    </span>
                  </label>
                </td>
                <td style="padding: 16px;">
                  <div style="
                    min-height: 24px;
                    border-bottom: 1px dashed #d1d5db;
                    color: #9ca3af;
                    font-style: italic;
                  ">${item.note || ''}</div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // React component for preview
  PreviewComponent: ({ content, style }) => {
    const items = content?.items || [];

    return (
      <div className="checklist-preview p-6">
        <h2 className="text-2xl font-bold mb-2">{content?.title || 'Checklist'}</h2>
        {content?.subtitle && (
          <p className="text-gray-600 mb-6">{content.subtitle}</p>
        )}
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <input type="checkbox" className="mt-1 w-5 h-5" />
              <div className="flex-1">
                <p className="text-gray-800">{item.text || item}</p>
                {item.note && (
                  <p className="text-sm text-gray-500 mt-1">{item.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

export default checklistTemplate;
