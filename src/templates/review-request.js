// /src/templates/review-request.js
// Review request template with 5-star visual and friendly text
// Used at the end of products to encourage reviews
// NO platform names (no "Etsy", "Gumroad") - keep it generic
// RELEVANT FILES: src/pages/VisualBuilder.jsx, src/lib/pdf-generator.js

// Generate HTML for review request section
export function generateReviewRequestHTML(profile, style = {}) {
  // Add null safety for profile
  profile = profile || { name: 'Creator' };

  const {
    fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif',
    primaryColor = '#1a1a1a',
    backgroundColor = '#ffffff',
    accentColor = '#3b82f6'
  } = style;

  // Star color (gold)
  const starColor = '#fbbf24';

  return `
    <div class="review-request-page" style="
      font-family: ${fontFamily};
      background: ${backgroundColor};
      padding: 60px;
      text-align: center;
    ">
      <!-- Hearts/Thank You -->
      <div style="
        font-size: 48px;
        margin-bottom: 24px;
      ">💜</div>

      <h2 style="
        font-size: 32px;
        font-weight: 700;
        color: ${primaryColor};
        margin-bottom: 16px;
      ">Thank You!</h2>

      <p style="
        font-size: 18px;
        color: ${primaryColor}99;
        margin-bottom: 40px;
        max-width: 500px;
        margin-left: auto;
        margin-right: auto;
        line-height: 1.6;
      ">
        I hope you found this resource valuable! If it helped you,
        I'd really appreciate a quick review.
      </p>

      <!-- 5 Star Visual -->
      <div style="
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-bottom: 32px;
      ">
        ${Array(5).fill().map(() => `
          <svg width="48" height="48" viewBox="0 0 24 24" fill="${starColor}">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        `).join('')}
      </div>

      <p style="
        font-size: 16px;
        color: ${primaryColor};
        font-weight: 500;
        margin-bottom: 16px;
      ">Your review helps others discover this resource!</p>

      <!-- Simple CTA Box -->
      <div style="
        background: ${accentColor}10;
        border-radius: 16px;
        padding: 24px 32px;
        max-width: 400px;
        margin: 0 auto 40px;
      ">
        <p style="
          color: ${primaryColor};
          font-size: 16px;
          margin-bottom: 8px;
        ">It only takes 30 seconds:</p>
        <p style="
          color: ${accentColor};
          font-size: 18px;
          font-weight: 600;
        ">Leave a quick ⭐⭐⭐⭐⭐ review</p>
      </div>

      <!-- Creator Sign-off -->
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
      ">
        ${profile.photo_url ? `
          <img
            src="${profile.photo_url}"
            alt="${profile.name}"
            style="
              width: 48px;
              height: 48px;
              border-radius: 50%;
              object-fit: cover;
            "
          />
        ` : ''}
        <div style="text-align: left;">
          <p style="
            font-size: 16px;
            color: ${primaryColor};
          ">With gratitude,</p>
          <p style="
            font-size: 18px;
            font-weight: 600;
            color: ${primaryColor};
          ">${profile.name}</p>
        </div>
      </div>
    </div>
  `;
}

// React component for review request preview
export function ReviewRequestPreview({ profile, style }) {
  const accentColor = style?.accentColor || '#3b82f6';
  const starColor = '#fbbf24';

  return (
    <div className="review-request-preview bg-white rounded-xl p-12 text-center">
      {/* Heart */}
      <div className="text-5xl mb-6">💜</div>

      <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>

      <p className="text-lg text-gray-600 mb-10 max-w-lg mx-auto">
        I hope you found this resource valuable! If it helped you,
        I'd really appreciate a quick review.
      </p>

      {/* 5 Stars */}
      <div className="flex justify-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map(i => (
          <svg key={i} className="w-12 h-12" viewBox="0 0 24 24" fill={starColor}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>

      <p className="text-base text-gray-900 font-medium mb-4">
        Your review helps others discover this resource!
      </p>

      {/* CTA Box */}
      <div
        className="rounded-2xl py-6 px-8 max-w-sm mx-auto mb-10"
        style={{ backgroundColor: `${accentColor}10` }}
      >
        <p className="text-gray-700 mb-2">It only takes 30 seconds:</p>
        <p className="text-lg font-semibold" style={{ color: accentColor }}>
          Leave a quick ⭐⭐⭐⭐⭐ review
        </p>
      </div>

      {/* Creator Sign-off */}
      <div className="flex items-center justify-center gap-3">
        {profile?.photo_url && (
          <img
            src={profile.photo_url}
            alt={profile.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        )}
        <div className="text-left">
          <p className="text-gray-600">With gratitude,</p>
          <p className="text-lg font-semibold text-gray-900">
            {profile?.name || 'Creator'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Alternative shorter review request text
export const reviewRequestVariants = {
  short: {
    heading: 'Enjoyed this?',
    body: 'A quick review would mean the world to me!',
    cta: 'Leave a ⭐⭐⭐⭐⭐ review'
  },
  friendly: {
    heading: 'Thank You!',
    body: 'I hope this helped! If you have a moment, a review would be amazing.',
    cta: 'Share your experience with a quick review'
  },
  professional: {
    heading: 'Your Feedback Matters',
    body: 'Reviews help me create better resources for you.',
    cta: 'Rate your experience'
  }
};

export default { generateReviewRequestHTML, ReviewRequestPreview, reviewRequestVariants };
