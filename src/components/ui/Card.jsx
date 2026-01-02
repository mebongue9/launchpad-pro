// /src/components/ui/Card.jsx
// Card container component for content sections
// Provides consistent styling for boxed content
// RELEVANT FILES: src/index.css, src/components/profiles/ProfileCard.jsx

export function Card({ children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  )
}
