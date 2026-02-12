'use client'

import { useState, useEffect, useRef } from 'react'
import ProductCatalog from './ProductCatalog'

interface CartSummary {
  totalQuantity: number
  lastItem?: { lineItemId: string; quantity: number; selectedSize?: string; modifiers?: { name: string; price: number }[] }
}

interface ProductCatalogPanelProps {
  onAddToCart: (product: { id: string; name: string; price: number; category?: string; image?: string; sizes?: { id: string; name: string; price: number }[]; modifiers?: { id: string; name: string; price: number }[] }) => void
  onProductSelect?: (product: { id: string; name: string; price: number; category?: string; image?: string; sizes?: { id: string; name: string; price: number }[]; modifiers?: { id: string; name: string; price: number }[] }) => void
  getCartSummaryByProductId?: (productId: string) => CartSummary
  onDecrementProductInCart?: (productId: string) => void
  /** When provided, use these products (from API) */
  products?: { id: string; name: string; price: number; category?: string; image?: string; sizes?: { id: string; name: string; price: number }[]; modifiers?: { id: string; name: string; price: number }[] }[]
  /** When provided, use these category names for filter (will have "All" prepended). No static fallback – API only. */
  categories?: string[]
  /** Full category list (id + name) to resolve product.category_id to category name so filter works */
  categoryList?: { id: string; name: string }[]
  /** True while products/categories are being fetched from API */
  isLoading?: boolean
}

export default function ProductCatalogPanel({
  onAddToCart,
  onProductSelect,
  getCartSummaryByProductId,
  onDecrementProductInCart,
  products: productsProp,
  categories: categoriesProp,
  categoryList = [],
  isLoading: isLoadingProp = false,
}: ProductCatalogPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const categoryScrollRef = useRef<HTMLDivElement>(null)

  const categories = categoriesProp && categoriesProp.length > 0
    ? ['All', ...categoriesProp]
    : ['All']

  // Resolve each product's category to a name that matches the filter (handles category_id or category object)
  const products = (productsProp?.map((p) => {
    const raw = p as { category?: string | { id?: unknown; name?: string }; category_id?: string | number }
    const rawCategory = raw.category
    let categoryName = typeof rawCategory === 'string' ? rawCategory.trim() : ''
    const rawCategoryId = raw.category_id ?? (rawCategory && typeof rawCategory === 'object' && 'id' in rawCategory ? (rawCategory as { id: unknown }).id : undefined)
    if (typeof rawCategory === 'object' && rawCategory?.name) categoryName = String(rawCategory.name).trim()
    if (categoryList.length > 0) {
      const idStr = rawCategoryId != null ? String(rawCategoryId) : ''
      const found = categoryList.find(
        (c) => String(c.id) === idStr || (categoryName && c.name.trim().toLowerCase() === categoryName.toLowerCase())
      )
      if (found) categoryName = found.name
      else if (idStr) {
        const byId = categoryList.find((c) => String(c.id) === idStr)
        if (byId) categoryName = byId.name
      }
    }
    return {
      ...p,
      category: categoryName,
      price: Number(p.price) || 0,
    }
  }) ?? [])

  // Clear filters function
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('All')
    // Focus search input after clearing
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
  }

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'All'

  // Scroll selected category into view on mobile
  useEffect(() => {
    if (categoryScrollRef.current) {
      const selectedButton = categoryScrollRef.current.querySelector('[aria-pressed="true"]') as HTMLElement
      if (selectedButton) {
        selectedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [selectedCategory])

  return (
    <div id="product-catalog-panel" className="flex-1 flex flex-col bg-neutral-50/50 min-w-0 w-full max-w-full h-full min-h-0 overflow-hidden relative z-0 isolate">
      {/* Top: Sticky Search Bar - Mobile First */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-200 shadow-soft sticky top-0 z-20 lg:relative lg:z-auto">
        {/* Search input - Always at top */}
        <div className="px-3 sm:px-4 py-3 sm:py-3.5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-4 sm:h-4 text-neutral-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-11 pr-10 sm:pr-11 py-3.5 sm:py-2.5 border border-neutral-200 rounded-xl sm:rounded-lg text-base sm:text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-neutral-800 touch-manipulation"
                aria-label="Search products"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-neutral-600 active:text-neutral-800 rounded-lg hover:bg-neutral-100 active:bg-neutral-200 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                  aria-label="Clear search"
                  type="button"
                >
                  <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 sm:px-3 py-3.5 sm:py-2.5 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-700 rounded-xl sm:rounded-lg text-sm font-medium transition-all min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 touch-manipulation shrink-0 flex items-center justify-center shadow-sm hover:shadow-md"
                title="Clear all filters"
                type="button"
                aria-label="Clear all filters"
              >
                <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="ml-2 sm:hidden text-sm font-semibold">Clear</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Mobile: Horizontal scrollable category chips - Below search */}
        <div className="lg:hidden border-t border-neutral-100 bg-white">
          <div 
            ref={categoryScrollRef}
            className="px-3 py-3 overflow-x-auto scrollbar-hide overscroll-x-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex gap-2.5 sm:gap-3 min-w-max pb-1">
              {categories.map((category) => {
                const isSelected = selectedCategory === category
                return (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category)
                      // Scroll to top of products when category changes
                      const productContainer = document.querySelector('[data-product-container]')
                      if (productContainer) {
                        productContainer.scrollTo({ top: 0, behavior: 'smooth' })
                      }
                    }}
                    className={`
                      shrink-0 px-5 sm:px-4 py-3 sm:py-2.5 rounded-full text-sm sm:text-xs font-semibold transition-all whitespace-nowrap min-h-[44px] touch-manipulation
                      ${isSelected
                        ? 'bg-primary-500 text-white shadow-lg ring-2 ring-primary-300 ring-offset-2 scale-105'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300 active:scale-95'
                      }
                    `}
                    aria-pressed={isSelected}
                    type="button"
                  >
                    {category === 'All' ? '✨ All' : category}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main: Sidebar + Product grid */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative min-w-0">
        {/* Left sidebar – vertical category filters (Desktop only) */}
        <aside className="hidden lg:flex flex-shrink-0 w-48 bg-white border-r border-neutral-200 py-4 overflow-y-auto min-w-0">
          <nav className="flex flex-col gap-2 px-3 w-full" aria-label="Product categories">
            <div className="px-2 py-1.5 mb-1">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Categories</h3>
            </div>
            {categories.map((category) => {
              const isSelected = selectedCategory === category
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all relative
                    ${isSelected
                      ? 'bg-primary-500 text-white shadow-md ring-2 ring-primary-400 ring-offset-2'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 active:bg-neutral-300'
                    }
                  `}
                  aria-pressed={isSelected}
                  aria-current={isSelected ? 'true' : undefined}
                  type="button"
                >
                  {category === 'All' && (
                    <span className="mr-2">✨</span>
                  )}
                  {category === 'All' ? 'All Products' : category}
                  {isSelected && (
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-neutral-50 text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200 border border-neutral-200 transition-all flex items-center justify-center gap-2"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            )}
          </nav>
        </aside>

        {/* Product grid - Full width on mobile, with sidebar on desktop */}
        <div 
          className="flex-1 overflow-y-auto min-w-0 overscroll-contain" 
          data-product-container
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <ProductCatalog
            addToCart={onAddToCart}
            onProductSelect={onProductSelect}
            getCartSummaryByProductId={getCartSummaryByProductId}
            onDecrementProductInCart={onDecrementProductInCart}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            products={products}
            isLoading={isLoadingProp}
          />
        </div>
      </div>
    </div>
  )
}
