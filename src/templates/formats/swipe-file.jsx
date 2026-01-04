// /src/templates/formats/swipe-file.js
// Swipe file format template with ready-to-copy templates
// Used for email scripts, social posts, and copy templates
// RELEVANT FILES: src/templates/formats/index.js, src/pages/VisualBuilder.jsx

export const swipeFileTemplate = {
  id: 'swipe-file',
  name: 'Swipe File',
  description: 'Ready-to-copy templates and scripts',
  icon: '📋',

  // Generate HTML structure for a swipe file page
  generateHTML: (content, style = {}) => {
    const templates = content.templates || [];
    const { fontFamily, primaryColor, backgroundColor } = style;

    return `
      <div class="swipe-file-page" style="
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
        ">${content.title || 'Swipe File'}</h1>

        ${content.subtitle ? `
          <p style="color: #666; font-size: 16px; margin-bottom: 32px;">
            ${content.subtitle}
          </p>
        ` : ''}

        <div class="templates" style="display: flex; flex-direction: column; gap: 24px;">
          ${templates.map((template, i) => `
            <div class="template-card" style="
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              overflow: hidden;
            ">
              <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                background: linear-gradient(90deg, ${primaryColor || '#3b82f6'}10, transparent);
                border-bottom: 1px solid #e5e7eb;
              ">
                <div>
                  <span style="
                    font-size: 12px;
                    color: ${primaryColor || '#3b82f6'};
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                  ">Template #${i + 1}</span>
                  <h3 style="
                    font-size: 16px;
                    font-weight: 600;
                    color: #1a1a1a;
                    margin-top: 4px;
                  ">${template.title || `Template ${i + 1}`}</h3>
                </div>
                <button style="
                  padding: 8px 16px;
                  background: ${primaryColor || '#3b82f6'};
                  color: white;
                  border: none;
                  border-radius: 6px;
                  font-size: 14px;
                  cursor: pointer;
                ">Copy</button>
              </div>
              <div style="padding: 20px;">
                ${template.category ? `
                  <span style="
                    display: inline-block;
                    padding: 4px 8px;
                    background: #f3f4f6;
                    color: #6b7280;
                    font-size: 12px;
                    border-radius: 4px;
                    margin-bottom: 12px;
                  ">${template.category}</span>
                ` : ''}
                <div style="
                  background: #f9fafb;
                  border-radius: 8px;
                  padding: 16px;
                  font-family: 'Courier New', monospace;
                  font-size: 14px;
                  line-height: 1.6;
                  color: #374151;
                  white-space: pre-wrap;
                ">${template.content || template.text}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // React component for preview
  PreviewComponent: ({ content, style }) => {
    const templates = content?.templates || [];

    return (
      <div className="swipe-file-preview p-6">
        <h2 className="text-2xl font-bold mb-2">{content?.title || 'Swipe File'}</h2>
        {content?.subtitle && (
          <p className="text-gray-600 mb-6">{content.subtitle}</p>
        )}
        <div className="space-y-6">
          {templates.map((template, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex justify-between items-center px-5 py-4 bg-gradient-to-r from-blue-50 to-transparent border-b">
                <div>
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                    Template #{i + 1}
                  </span>
                  <h3 className="font-semibold text-gray-900 mt-1">
                    {template.title || `Template ${i + 1}`}
                  </h3>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  Copy
                </button>
              </div>
              <div className="p-5">
                {template.category && (
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded mb-3">
                    {template.category}
                  </span>
                )}
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700 whitespace-pre-wrap">
                  {template.content || template.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

export default swipeFileTemplate;
