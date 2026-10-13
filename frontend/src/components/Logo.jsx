import React, { useState } from 'react';

/**
 * ClaimNest Brand Logo Component
 * 
 * Custom Image Support:
 * To use your own image for the logo:
 * 1. Directory: ClaimNest/frontend/public/
 * 2. Filename: logo.png (or logo.svg / logo.jpg)
 * 
 * When your image file is in frontend/public/, it loads automatically.
 * If not added yet, it falls back to the clean built-in vector emblem.
 * 
 * @param {Object} props
 * @param {number} [props.size=34] - Icon dimensions in px
 * @param {boolean} [props.showText=true] - Whether to show the ClaimNest title
 */
export default function Logo({ size = 34, showText = true }) {
  // 0: try /logo.png, 1: try /logo.svg, 2: fallback to inline SVG
  const [attempt, setAttempt] = useState(0);

  const imageSources = ['/logo.png', '/logo.svg'];

  return (
    <div className="d-inline-flex align-items-center gap-2 brand-logo-wrap">
      {attempt < imageSources.length ? (
        <img
          src={imageSources[attempt]}
          alt="ClaimNest Logo"
          width={size}
          height={size}
          style={{
            objectFit: 'contain',
            borderRadius: '8px',
            flexShrink: 0
          }}
          onError={() => setAttempt((prev) => prev + 1)}
        />
      ) : (
        /* Built-in SVG Emblem in #815854 and #F9EBDE */
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0, borderRadius: '8px' }}
        >
          {/* Rounded Container */}
          <rect width="48" height="48" rx="10" fill="#815854" />
          
          {/* Protective Shield Base in #F9EBDE */}
          <path
            d="M24 8 L37 13.5 V24 C37 31.8 31.3 37.8 24 40.5 C16.7 37.8 11 31.8 11 24 V13.5 Z"
            fill="#F9EBDE"
          />

          {/* Nest Cradle Arch in #815854 */}
          <path
            d="M16 25 C16 29.5 19.5 33 24 33 C28.5 33 32 29.5 32 25"
            stroke="#815854"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Verified Claim / Warranty Checkmark in #815854 */}
          <path
            d="M19.5 22 L22.5 25 L28.5 17.5"
            stroke="#815854"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Brand Text */}
      {showText && (
        <span className="brand-text">
          Claim<span className="brand-text-accent">Nest</span>
        </span>
      )}
    </div>
  );
}
