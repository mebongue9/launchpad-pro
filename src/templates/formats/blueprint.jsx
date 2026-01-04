// /src/templates/formats/blueprint.js
// Blueprint format template with visual process flow
// Used for strategic overviews and frameworks
// RELEVANT FILES: src/templates/formats/index.js, src/pages/VisualBuilder.jsx

export const blueprintTemplate = {
  id: 'blueprint',
  name: 'Blueprint',
  description: 'Visual process flow with numbered steps',
  icon: '🗺️',

  // Generate HTML structure for a blueprint page
  generateHTML: (content, style = {}) => {
    const steps = content.steps || [];
    const { fontFamily, primaryColor, backgroundColor } = style;

    return `
      <div class="blueprint-page" style="
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
          text-align: center;
        ">${content.title || 'Blueprint'}</h1>

        ${content.subtitle ? `
          <p style="color: #666; font-size: 16px; margin-bottom: 48px; text-align: center;">
            ${content.subtitle}
          </p>
        ` : ''}

        <div class="blueprint-flow" style="position: relative;">
          ${steps.map((step, i) => `
            <div class="step" style="
              display: flex;
              gap: 24px;
              margin-bottom: ${i < steps.length - 1 ? '48px' : '0'};
              position: relative;
            ">
              <!-- Number Circle -->
              <div style="
                flex-shrink: 0;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: ${primaryColor || '#3b82f6'};
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                font-weight: bold;
                box-shadow: 0 4px 12px ${primaryColor || '#3b82f6'}40;
              ">${i + 1}</div>

              <!-- Connector Line -->
              ${i < steps.length - 1 ? `
                <div style="
                  position: absolute;
                  left: 27px;
                  top: 56px;
                  width: 2px;
                  height: calc(100% - 8px);
                  background: linear-gradient(to bottom, ${primaryColor || '#3b82f6'}, ${primaryColor || '#3b82f6'}40);
                "></div>
              ` : ''}

              <!-- Content -->
              <div style="flex: 1; padding-top: 8px;">
                <h3 style="
                  font-size: 20px;
                  font-weight: 600;
                  color: #1a1a1a;
                  margin-bottom: 8px;
                ">${step.title || `Step ${i + 1}`}</h3>
                <p style="
                  color: #6b7280;
                  line-height: 1.6;
                  margin-bottom: 12px;
                ">${step.description || ''}</p>

                ${step.tips ? `
                  <div style="
                    background: #f9fafb;
                    border-left: 3px solid ${primaryColor || '#3b82f6'};
                    padding: 12px 16px;
                    border-radius: 0 8px 8px 0;
                  ">
                    <span style="font-size: 12px; color: ${primaryColor || '#3b82f6'}; font-weight: 600;">
                      💡 Pro Tip:
                    </span>
                    <p style="color: #4b5563; margin-top: 4px; font-size: 14px;">
                      ${step.tips}
                    </p>
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // React component for preview
  PreviewComponent: ({ content, style }) => {
    const steps = content?.steps || [];

    return (
      <div className="blueprint-preview p-6">
        <h2 className="text-2xl font-bold mb-2 text-center">{content?.title || 'Blueprint'}</h2>
        {content?.subtitle && (
          <p className="text-gray-600 mb-12 text-center">{content.subtitle}</p>
        )}
        <div className="relative">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-6 mb-12 last:mb-0 relative">
              {/* Number Circle */}
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                {i + 1}
              </div>

              {/* Connector Line */}
              {i < steps.length - 1 && (
                <div className="absolute left-7 top-14 w-0.5 h-[calc(100%-8px)] bg-gradient-to-b from-blue-600 to-blue-200" />
              )}

              {/* Content */}
              <div className="flex-1 pt-2">
                <h3 className="text-xl font-semibold mb-2">{step.title || `Step ${i + 1}`}</h3>
                <p className="text-gray-600 mb-3">{step.description}</p>
                {step.tips && (
                  <div className="bg-gray-50 border-l-3 border-blue-600 pl-4 py-3 rounded-r-lg">
                    <span className="text-xs font-semibold text-blue-600">💡 Pro Tip:</span>
                    <p className="text-gray-700 text-sm mt-1">{step.tips}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

export default blueprintTemplate;
