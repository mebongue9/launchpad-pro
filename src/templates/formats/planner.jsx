// /src/templates/formats/planner.js
// Planner format template with date-based daily/weekly layouts
// Used for scheduling and goal tracking
// RELEVANT FILES: src/templates/formats/index.js, src/pages/VisualBuilder.jsx

export const plannerTemplate = {
  id: 'planner',
  name: 'Planner',
  description: 'Date-based daily or weekly layouts',
  icon: '📅',

  // Generate HTML structure for a planner page
  generateHTML: (content, style = {}) => {
    const days = content.days || [];
    const { fontFamily, primaryColor, backgroundColor } = style;

    return `
      <div class="planner-page" style="
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
        ">${content.title || 'Weekly Planner'}</h1>

        ${content.subtitle ? `
          <p style="color: #666; font-size: 16px; margin-bottom: 32px;">
            ${content.subtitle}
          </p>
        ` : ''}

        <div class="planner-grid" style="
          display: grid;
          grid-template-columns: repeat(${content.columns || 2}, 1fr);
          gap: 16px;
        ">
          ${days.map((day, i) => `
            <div class="day-block" style="
              border: 2px solid ${primaryColor || '#e5e7eb'};
              border-radius: 12px;
              overflow: hidden;
            ">
              <div style="
                background: ${primaryColor || '#f3f4f6'};
                color: ${primaryColor ? '#ffffff' : '#374151'};
                padding: 12px 16px;
                font-weight: 600;
              ">
                ${day.label || `Day ${i + 1}`}
              </div>
              <div style="padding: 16px;">
                <div style="margin-bottom: 12px;">
                  <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                    Focus:
                  </label>
                  <div style="
                    height: 28px;
                    border-bottom: 1px solid #d1d5db;
                  "></div>
                </div>
                <div style="margin-bottom: 12px;">
                  <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                    Tasks:
                  </label>
                  ${Array(3).fill().map(() => `
                    <div style="
                      display: flex;
                      align-items: center;
                      gap: 8px;
                      height: 28px;
                      border-bottom: 1px solid #e5e7eb;
                    ">
                      <input type="checkbox" style="width: 14px; height: 14px;" />
                      <div style="flex: 1;"></div>
                    </div>
                  `).join('')}
                </div>
                <div>
                  <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                    Notes:
                  </label>
                  <div style="
                    min-height: 48px;
                    border: 1px dashed #d1d5db;
                    border-radius: 4px;
                  "></div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // React component for preview
  PreviewComponent: ({ content, style }) => {
    const days = content?.days || [
      { label: 'Day 1' },
      { label: 'Day 2' },
      { label: 'Day 3' },
      { label: 'Day 4' }
    ];

    // Static class mapping for Tailwind JIT compatibility
    const columnClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      7: 'grid-cols-7'
    };
    const gridColsClass = columnClasses[content?.columns] || 'grid-cols-2';

    return (
      <div className="planner-preview p-6">
        <h2 className="text-2xl font-bold mb-2">{content?.title || 'Weekly Planner'}</h2>
        {content?.subtitle && (
          <p className="text-gray-600 mb-6">{content.subtitle}</p>
        )}
        <div className={`grid ${gridColsClass} gap-4`}>
          {days.map((day, i) => (
            <div key={i} className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 font-semibold">
                {day.label || `Day ${i + 1}`}
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Focus:</label>
                  <div className="h-7 border-b border-gray-300" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Tasks:</label>
                  {[1, 2, 3].map(j => (
                    <div key={j} className="flex items-center gap-2 h-7 border-b border-gray-200">
                      <input type="checkbox" className="w-3.5 h-3.5" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Notes:</label>
                  <div className="min-h-12 border border-dashed border-gray-300 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

export default plannerTemplate;
