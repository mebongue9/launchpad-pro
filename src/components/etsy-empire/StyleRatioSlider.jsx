// /src/components/etsy-empire/StyleRatioSlider.jsx
// Slider for manifestable ratio (50-90%)
// Controls the aesthetic balance between "Manifestable" and "Pinterest" styles
// RELEVANT FILES: src/components/etsy-empire/NewProjectModal.jsx

import { useState, useEffect } from 'react'

export function StyleRatioSlider({ value, onChange, disabled = false }) {
  // value is a decimal (0.50 to 0.90)
  // Display as percentage (50% to 90%)
  const percentage = Math.round(value * 100)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-amber-600 font-medium">Manifestable</span>
        <span className="text-pink-600 font-medium">Pinterest</span>
      </div>

      <div className="relative">
        <input
          type="range"
          min="50"
          max="90"
          step="5"
          value={percentage}
          onChange={(e) => onChange(parseInt(e.target.value) / 100)}
          disabled={disabled}
          className="w-full h-2 bg-gradient-to-r from-amber-200 via-purple-200 to-pink-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-purple-500
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-purple-500
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>50%</span>
        <span className="text-sm font-medium text-purple-600">{percentage}%</span>
        <span>90%</span>
      </div>

      <p className="text-xs text-gray-500 text-center">
        {percentage <= 60
          ? 'More earthy, spiritual aesthetic'
          : percentage >= 80
            ? 'More trendy, Pinterest-style aesthetic'
            : 'Balanced aesthetic mix'}
      </p>
    </div>
  )
}
