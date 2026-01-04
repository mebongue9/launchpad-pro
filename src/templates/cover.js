// /src/templates/cover.js
// Cover page template using profile branding fields
// Used at the start of every PDF/product
// RELEVANT FILES: src/pages/VisualBuilder.jsx, src/lib/pdf-generator.js

// Generate HTML for a branded cover page
export function generateCoverHTML(product, profile, style = {}) {
  const {
    fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif',
    primaryColor = '#1a1a1a',
    backgroundColor = '#ffffff',
    accentColor = '#3b82f6'
  } = style;

  return `
    <div class="cover-page" style="
      font-family: ${fontFamily};
      background: ${backgroundColor};
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 60px;
      text-align: center;
      position: relative;
    ">
      <!-- Logo -->
      ${profile.logo_url ? `
        <img
          src="${profile.logo_url}"
          alt="${profile.business_name || profile.name}"
          style="
            max-width: 200px;
            max-height: 80px;
            object-fit: contain;
            margin-bottom: 48px;
          "
        />
      ` : ''}

      <!-- Product Title -->
      <h1 style="
        font-size: 48px;
        font-weight: 700;
        color: ${primaryColor};
        margin-bottom: 16px;
        line-height: 1.2;
        max-width: 700px;
      ">${product.name}</h1>

      <!-- Subtitle/Description -->
      ${product.description ? `
        <p style="
          font-size: 20px;
          color: ${primaryColor}99;
          margin-bottom: 48px;
          max-width: 600px;
          line-height: 1.5;
        ">${product.description}</p>
      ` : ''}

      <!-- Creator Section -->
      <div style="
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px 32px;
        background: ${accentColor}10;
        border-radius: 16px;
        margin-top: auto;
      ">
        <!-- Photo -->
        ${profile.photo_url ? `
          <img
            src="${profile.photo_url}"
            alt="${profile.name}"
            style="
              width: 64px;
              height: 64px;
              border-radius: 50%;
              object-fit: cover;
              border: 3px solid ${accentColor};
            "
          />
        ` : `
          <div style="
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: ${accentColor};
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: 600;
          ">${profile.name?.charAt(0) || 'C'}</div>
        `}

        <div style="text-align: left;">
          <p style="
            font-weight: 600;
            color: ${primaryColor};
            font-size: 18px;
            margin-bottom: 4px;
          ">${profile.name}</p>

          ${profile.tagline ? `
            <p style="
              color: ${primaryColor}99;
              font-size: 14px;
              margin-bottom: 4px;
            ">${profile.tagline}</p>
          ` : ''}

          ${profile.social_handle ? `
            <p style="
              color: ${accentColor};
              font-size: 14px;
              font-weight: 500;
            ">${profile.social_handle}</p>
          ` : ''}
        </div>
      </div>

      <!-- Footer with Business Name -->
      ${profile.business_name ? `
        <p style="
          position: absolute;
          bottom: 40px;
          color: ${primaryColor}60;
          font-size: 14px;
        ">© ${new Date().getFullYear()} ${profile.business_name}</p>
      ` : ''}
    </div>
  `;
}

// React component for cover preview
export function CoverPreview({ product, profile, style }) {
  const accentColor = style?.accentColor || '#3b82f6';

  return (
    <div className="cover-preview min-h-[60vh] flex flex-col justify-center items-center p-12 text-center relative bg-white rounded-xl">
      {/* Logo */}
      {profile?.logo_url && (
        <img
          src={profile.logo_url}
          alt={profile.business_name || profile.name}
          className="max-w-[200px] max-h-[80px] object-contain mb-12"
        />
      )}

      {/* Product Title */}
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 max-w-2xl">
        {product?.name || 'Product Title'}
      </h1>

      {/* Description */}
      {product?.description && (
        <p className="text-xl text-gray-600 mb-12 max-w-xl">
          {product.description}
        </p>
      )}

      {/* Creator Section */}
      <div
        className="flex items-center gap-4 px-8 py-5 rounded-2xl mt-auto"
        style={{ backgroundColor: `${accentColor}10` }}
      >
        {/* Photo */}
        {profile?.photo_url ? (
          <img
            src={profile.photo_url}
            alt={profile.name}
            className="w-16 h-16 rounded-full object-cover"
            style={{ border: `3px solid ${accentColor}` }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-semibold"
            style={{ backgroundColor: accentColor }}
          >
            {profile?.name?.charAt(0) || 'C'}
          </div>
        )}

        <div className="text-left">
          <p className="font-semibold text-gray-900 text-lg">
            {profile?.name || 'Creator Name'}
          </p>
          {profile?.tagline && (
            <p className="text-gray-600 text-sm">{profile.tagline}</p>
          )}
          {profile?.social_handle && (
            <p className="text-sm font-medium" style={{ color: accentColor }}>
              {profile.social_handle}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      {profile?.business_name && (
        <p className="absolute bottom-8 text-gray-400 text-sm">
          © {new Date().getFullYear()} {profile.business_name}
        </p>
      )}
    </div>
  );
}

export default { generateCoverHTML, CoverPreview };
