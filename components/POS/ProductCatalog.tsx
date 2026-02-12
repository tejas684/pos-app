'use client'

import { useMemo, memo } from 'react'

interface Product {
  id: string
  name: string
  price: number
  category?: string
  image?: string
  sizes?: { id: string; name: string; price: number }[]
  modifiers?: { id: string; name: string; price: number }[]
}

interface CartSummary {
  totalQuantity: number
  lastItem?: { lineItemId: string; quantity: number; selectedSize?: string; modifiers?: { name: string; price: number }[] }
}

interface ProductCatalogProps {
  addToCart: (product: Product) => void
  onProductSelect?: (product: Product) => void
  getCartSummaryByProductId?: (productId: string) => CartSummary
  onDecrementProductInCart?: (productId: string) => void
  searchQuery?: string
  selectedCategory?: string
  /** Products from API – no static fallback; only API data is shown */
  products?: Product[]
  /** True while products are being fetched */
  isLoading?: boolean
}

function ProductCatalog({
  addToCart,
  onProductSelect,
  getCartSummaryByProductId,
  onDecrementProductInCart,
  searchQuery = '',
  selectedCategory: propSelectedCategory = 'All',
  products: productsProp,
  isLoading = false,
}: ProductCatalogProps) {
  const selectedCategory = propSelectedCategory
  const productsSource = productsProp ?? []

  const filteredProducts = useMemo(() => {
    let filtered = productsSource

    if (selectedCategory !== 'All') {
      const want = selectedCategory.trim().toLowerCase()
      filtered = filtered.filter((p) => (p.category ?? '').trim().toLowerCase() === want)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((p) => {
        const name = (p.name ?? '').toString().toLowerCase()
        const cat = (p.category ?? '').toString().toLowerCase()
        const id = (p.id ?? '').toString().toLowerCase()
        const matchesName = name.includes(q)
        const matchesCategory = cat.includes(q)
        const matchesId = id.includes(q)
        // Also search in size and modifier names (API may return non-array)
        const sizes = Array.isArray(p.sizes) ? p.sizes : []
        const modifiers = Array.isArray(p.modifiers) ? p.modifiers : []
        const sizeNames = sizes.map((s) => (s?.name ?? '').toString().toLowerCase()).join(' ')
        const modifierNames = modifiers.map((m) => (m?.name ?? '').toString().toLowerCase()).join(' ')
        const matchesSizes = sizeNames.includes(q)
        const matchesModifiers = modifierNames.includes(q)
        // Shortcuts: veg→vegetable, bev→beverage, bar→beverage/bar
        const shortcuts =
          (q === 'veg' && (cat.includes('vegetable') || name.includes('veg'))) ||
          (q === 'bev' && cat.includes('beverage')) ||
          (q === 'bar' && (cat.includes('beverage') || name.includes('bar')))
        return matchesName || matchesCategory || matchesId || matchesSizes || matchesModifiers || shortcuts
      })
    }

    return filtered
  }, [productsSource, selectedCategory, searchQuery])

  const handleProductClick = (product: Product) => {
    if (onProductSelect) {
      onProductSelect(product)
    } else {
      addToCart(product)
    }
  }

  // Group products by category for better organization when showing all
  const groupedProducts = useMemo(() => {
    if (selectedCategory !== 'All' || searchQuery.trim()) {
      return { '': filteredProducts }
    }
    
    const grouped: Record<string, Product[]> = {}
    filteredProducts.forEach(product => {
      const cat = product.category ?? ''
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(product)
    })
    return grouped
  }, [filteredProducts, selectedCategory, searchQuery])

  const showGrouped = selectedCategory === 'All' && !searchQuery.trim()

  if (productsSource.length === 0) {
    return (
      <div className="p-2 sm:p-3 lg:p-4 pb-3 sm:pb-4">
        <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-center">
          <svg className="w-14 h-14 sm:w-16 sm:h-16 text-neutral-400 mb-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-neutral-700 font-semibold text-base sm:text-lg">
            {isLoading ? 'Loading products…' : 'No products'}
          </p>
          <p className="text-neutral-500 text-sm mt-1.5">
            {isLoading ? 'Fetching from API…' : 'Products will appear here when loaded from the API.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-5 pb-4 sm:pb-5">
      {/* Product count header - Mobile optimized */}
      <div className="mb-2 sm:mb-3 px-1 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-neutral-800">
            {selectedCategory === 'All' && !searchQuery.trim() 
              ? 'All Products' 
              : searchQuery.trim()
              ? `Search Results${selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}`
              : `${selectedCategory} Products`
            }
          </h2>
          <span className="px-3 py-1.5 sm:px-2.5 sm:py-1 bg-primary-100 text-primary-700 rounded-full text-xs sm:text-xs font-semibold whitespace-nowrap">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {showGrouped ? (
        // Show grouped by category
        Object.entries(groupedProducts).map(([category, products]) => (
          <div key={category} className="mb-4 sm:mb-5 last:mb-0">
            <div className="mb-2 sm:mb-3 px-1">
              <h3 className="text-sm sm:text-base font-semibold text-neutral-700 flex items-center gap-2">
                <span className="w-1 h-5 sm:h-6 bg-primary-500 rounded-full"></span>
                <span>{category}</span>
                <span className="text-xs sm:text-sm text-neutral-500 font-normal">({products.length})</span>
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onProductClick={handleProductClick}
                  cartSummary={getCartSummaryByProductId?.(product.id)}
                  onDecrementInCart={onDecrementProductInCart}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        // Show flat list when filtered
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={handleProductClick}
                cartSummary={getCartSummaryByProductId?.(product.id)}
                onDecrementInCart={onDecrementProductInCart}
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16 sm:py-20 px-4">
              <div className="rounded-2xl bg-neutral-100 p-6 sm:p-8 mb-4 sm:mb-5">
                <svg className="w-14 h-14 sm:w-16 sm:h-16 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-neutral-700 font-semibold text-base sm:text-lg">No products found</p>
              <p className="text-neutral-500 text-sm sm:text-sm mt-1.5 text-center">Try a different search or category</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Product card: name + price only, with Add button below; clean theme
function ProductCard({
  product,
  onProductClick,
  cartSummary,
  onDecrementInCart,
}: {
  product: Product
  onProductClick: (product: Product) => void
  cartSummary?: CartSummary
  onDecrementInCart?: (productId: string) => void
}) {
  const inCart = cartSummary && cartSummary.totalQuantity > 0
  const totalQty = cartSummary?.totalQuantity ?? 0
  const price = (Number(product.price) || 0).toFixed(2)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onProductClick(product)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-qty-decrement]')) {
      e.stopPropagation()
      onDecrementInCart?.(product.id)
      return
    }
    if (target.closest('[data-qty-increment]')) {
      e.stopPropagation()
      onProductClick(product)
      return
    }
    onProductClick(product)
  }

  return (
    <article
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Add ${product.name} to cart - Price: ${price}`}
      className="group h-full flex flex-col bg-white rounded-xl overflow-hidden border border-neutral-200/80 shadow-sm hover:shadow-md hover:border-primary-300/60 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 touch-manipulation min-w-0"
    >
      {/* Content: name + price - sized for readability at 100% zoom */}
      <div className="flex flex-col flex-1 p-4 min-w-0">
        <h3
          className="font-bold text-neutral-900 text-base leading-snug line-clamp-2 mb-2 break-words"
          title={product.name}
        >
          {product.name}
        </h3>
        <p className="text-lg font-bold text-primary-600 tracking-tight mb-3">
          ₹{price}
        </p>

        {/* Quantity controls when in cart; otherwise card click adds to cart */}
        {inCart ? (
          <div className="flex flex-col gap-1.5 mt-auto">
            <div className="flex items-center justify-center gap-0.5 bg-primary-50 rounded-lg border border-primary-200/80 overflow-hidden">
              <button
                type="button"
                data-qty-decrement
                onClick={(e) => {
                  e.stopPropagation()
                  onDecrementInCart?.(product.id)
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-primary-700 hover:bg-primary-100 transition-colors text-sm"
                aria-label="Decrease quantity"
              >
                <span className="text-xl font-medium leading-none">−</span>
              </button>
              <span className="min-w-[28px] text-center text-xs font-bold text-primary-700">{totalQty}</span>
              <button
                type="button"
                data-qty-increment
                onClick={(e) => {
                  e.stopPropagation()
                  onProductClick(product)
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-primary-700 hover:bg-primary-100 transition-colors text-sm"
                aria-label="Increase quantity"
              >
                <span className="text-xl font-medium leading-none">+</span>
              </button>
            </div>
            <span className="text-[10px] text-center text-neutral-500 font-medium">Customise</span>
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default memo(ProductCatalog)
