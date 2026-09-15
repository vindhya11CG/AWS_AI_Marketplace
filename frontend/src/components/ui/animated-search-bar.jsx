import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import './animated-search-bar.css'

function GooeyFilter() {
  return (
    <svg className="gooey-search-filter" aria-hidden="true">
      <defs>
        <filter id="goo-effect">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -15"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  )
}

function SearchIcon() {
  return (
    <motion.svg
      initial={{ opacity: 0, scale: 0.8, x: -4 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -4 }}
      transition={{ delay: 0.1, duration: 0.35, type: 'spring', bounce: 0.15 }}
      width="17"
      height="17"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </motion.svg>
  )
}

function LoadingIcon() {
  return <span className="gooey-search-loading" aria-label="Loading" role="status" />
}

function InfoIcon() {
  return (
    <svg className="gooey-search-info" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 9v5M10 6.5v.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function isUnsupportedBrowser() {
  if (typeof navigator === 'undefined') return false
  const userAgent = navigator.userAgent.toLowerCase()
  const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('chromium') && !userAgent.includes('android') && !userAgent.includes('firefox')
  return isSafari || userAgent.includes('crios')
}

export default function GooeySearchBar({ value = '', onChange, suggestions = [], placeholder = 'Search by any word...' }) {
  const inputRef = useRef(null)
  const [isExpanded, setIsExpanded] = useState(Boolean(value))
  const [isLoading, setIsLoading] = useState(false)
  const unsupportedBrowser = useMemo(() => isUnsupportedBrowser(), [])
  const filteredSuggestions = useMemo(() => {
    const normalizedValue = value.trim().toLowerCase()
    if (!normalizedValue) return []
    return suggestions
      .filter((suggestion) => suggestion.toLowerCase().includes(normalizedValue))
      .slice(0, 5)
  }, [suggestions, value])

  useEffect(() => {
    if (!value) {
      setIsLoading(false)
      return undefined
    }
    setIsLoading(true)
    const timeoutId = window.setTimeout(() => setIsLoading(false), 350)
    return () => window.clearTimeout(timeoutId)
  }, [value])

  useEffect(() => {
    if (isExpanded) inputRef.current?.focus()
  }, [isExpanded])

  const openSearch = () => setIsExpanded(true)
  const closeSearch = () => {
    setIsExpanded(false)
    onChange('')
  }

  return (
    <div className={clsx('gooey-search-wrapper', unsupportedBrowser && 'gooey-search-no-goo')}>
      <GooeyFilter />
      <div className="gooey-search-content">
        <motion.div
          className="gooey-search-inner"
          initial={false}
          animate={{ width: isExpanded ? 'min(100%, 320px)' : 112 }}
          transition={{ duration: 0.45, type: 'spring', bounce: 0.18 }}
        >
          <button
            type="button"
            className={clsx('gooey-search-button', isExpanded && 'gooey-search-button-expanded')}
            onClick={isExpanded ? undefined : openSearch}
            aria-label={isExpanded ? undefined : 'Open search'}
          >
            {!isExpanded ? (
              <span className="gooey-search-label">Search</span>
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={value}
                className="gooey-search-input"
                placeholder={placeholder}
                aria-label="Search Marketplace"
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') closeSearch()
                }}
              />
            )}
          </button>

          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.button
                type="button"
                className="gooey-search-icon-button"
                initial={{ x: -12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -12, opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={value ? closeSearch : openSearch}
                aria-label={value ? 'Clear search' : 'Search'}
              >
                {isLoading ? <LoadingIcon /> : <SearchIcon />}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {isExpanded && filteredSuggestions.length > 0 && (
            <motion.div
              className="gooey-search-results"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              role="listbox"
              aria-label="Search suggestions"
            >
              {filteredSuggestions.map((suggestion) => (
                <button
                  type="button"
                  className="gooey-search-result"
                  key={suggestion}
                  role="option"
                  onClick={() => onChange(suggestion)}
                >
                  <InfoIcon />
                  <span>{suggestion}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
