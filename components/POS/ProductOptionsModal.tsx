'use client'

import { useState, useEffect, useMemo } from 'react'

interface ProductSize {
  id: string
  name: string
  price: number
  color?: string
}

interface Modifier {
  id: string
  name: string
  price: number
}

interface Product {
  id: string
  name: string
  price: number
  category?: string
  image?: string
  sizes?: ProductSize[]
  modifiers?: Modifier[]
}

interface CartItem {
  id: string
  lineItemId: string
  name: string
  price: number
  quantity: number
  category?: string
  image?: string
  modifiers?: { name: string; price: number }[]
  notes?: string
  discount?: number
  discountType?: 'percentage' | 'fixed'
  selectedSize?: string
}

interface ProductOptionsModalProps {
  isOpen: boolean
  product: Product | null
  editingCartItem?: CartItem | null
  onClose: () => void
  onAddToCart: (item: {
    id: string
    name: string
    price: number
    quantity: number
    category?: string
    image?: string
    modifiers?: { name: string; price: number }[]
    notes?: string
    discount?: number
    discountType?: 'percentage' | 'fixed'
    selectedSize?: string
  }) => void
}

// Default size (base price) + Medium, Large, Extra Large sizes
// Default size should be added dynamically based on product price
const getDefaultSizes = (basePrice: number): ProductSize[] => [
  { id: 'default', name: 'Default', price: basePrice, color: '#6B7280' }, // Gray
  { id: 'medium', name: 'Medium', price: 180, color: '#3B82F6' }, // Blue
  { id: 'large', name: 'Large', price: 220, color: '#10B981' }, // Green
  { id: 'xlarge', name: 'Extra Large', price: 260, color: '#F59E0B' }, // Amber
]

// Sample modifiers - in a real app, this would come from the product data
const defaultModifiers: Modifier[] = [
  { id: 'mod1', name: 'Beet Salty', price: 25 },
  { id: 'mod2', name: 'Caeser Salad', price: 50 },
  { id: 'mod3', name: 'House Salad', price: 40 },
  { id: 'mod4', name: 'Onion Ring', price: 50 },
  { id: 'mod5', name: 'Seasoned Fries', price: 70 },
  { id: 'mod6', name: 'sharmaPlus', price: 60 },
]

export default function ProductOptionsModal({
  isOpen,
  product,
  editingCartItem,
  onClose,
  onAddToCart,
}: ProductOptionsModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([])
  const [discountInput, setDiscountInput] = useState('')
  const [notes, setNotes] = useState('')
  const [showSizeDropdown, setShowSizeDropdown] = useState(false)

  // Get available sizes and modifiers for the product
  // Always include default size (base price) above Medium
  const availableSizes = useMemo(() => {
    const basePrice = product?.price || 0
    if (product?.sizes && product.sizes.length > 0) {
      // Check if default size already exists
      const hasDefault = product.sizes.some(s => s.id === 'default')
      if (hasDefault) {
        // Ensure default is first, then others
        const defaultSize = product.sizes.find(s => s.id === 'default')
        const otherSizes = product.sizes.filter(s => s.id !== 'default')
        return defaultSize ? [defaultSize, ...otherSizes] : product.sizes
      } else {
        // Add default size at the beginning
        return [
          { id: 'default', name: 'Default', price: basePrice, color: '#6B7280' },
          ...product.sizes
        ]
      }
    }
    // If no sizes defined, use default sizes with base price
    return getDefaultSizes(basePrice)
  }, [product])

  // Modifiers: Show all 6 available modifiers
  const availableModifiers = useMemo(() => {
    // Always return all 6 modifiers from defaultModifiers
    return defaultModifiers
  }, [])

  // Reset state when modal opens/closes or product changes
  // If editing, pre-populate with cart item data
  useEffect(() => {
    if (isOpen && product) {
      if (editingCartItem) {
        // Pre-populate with cart item data
        setQuantity(editingCartItem.quantity)
        setDiscountInput(editingCartItem.discount ? `${editingCartItem.discount}%` : '')
        setNotes(editingCartItem.notes || '')
        
        // Set selected size if it exists
        if (editingCartItem.selectedSize) {
          const size = availableSizes.find(s => s.name === editingCartItem.selectedSize)
          if (size) {
            setSelectedSize(size)
          } else if (editingCartItem.selectedSize === 'Default') {
            // Find default size
            const defaultSize = availableSizes.find(s => s.id === 'default')
            if (defaultSize) {
              setSelectedSize(defaultSize)
            }
          }
        }
        
        // Set selected modifiers
        if (editingCartItem.modifiers && editingCartItem.modifiers.length > 0) {
          // Match modifiers by name
          const matchedModifiers = availableModifiers.filter(mod => 
            editingCartItem.modifiers?.some(cartMod => cartMod.name === mod.name)
          )
          setSelectedModifiers(matchedModifiers)
        } else {
          setSelectedModifiers([])
        }
      } else {
        // New product - reset to defaults; default-select first size
        setQuantity(1)
        setSelectedSize(availableSizes[0] ?? null)
        setSelectedModifiers([])
        setDiscountInput('')
        setNotes('')
      }
      setShowSizeDropdown(false)
    }
  }, [isOpen, product?.id, editingCartItem, availableSizes])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('.size-dropdown-container')) {
        setShowSizeDropdown(false)
      }
    }

    if (isOpen && showSizeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, showSizeDropdown])

  // Calculate prices
  // This logic works for all product types:
  // - Products with sizes: unitPrice = selectedSize.price (replaces base price)
  // - Products without sizes: unitPrice = product.price (base price)
  // - Products with modifiers: modifiers are added to unit price
  // - Products without modifiers: modifierTotal = 0, no effect
  // DO NOT add base + size together - size price REPLACES base price
  const unitPrice = selectedSize ? selectedSize.price : (product?.price || 0)
  const modifierTotal = selectedModifiers.reduce((sum, mod) => sum + mod.price, 0)
  
  // Full unit price includes modifiers (if any)
  const fullUnitPrice = unitPrice + modifierTotal

  // Parse discount input — percentage only (0–100)
  const parsedDiscount = useMemo(() => {
    const trimmed = discountInput.trim().replace(/%/g, '').trim()
    if (!trimmed) return null
    const num = parseFloat(trimmed)
    if (isNaN(num) || num < 0 || num > 100) return null
    return { value: num, type: 'percentage' as const }
  }, [discountInput])

  // Line total = (unit price + modifiers) × quantity
  // This recalculates automatically when quantity, unitPrice, or modifiers change
  const lineTotal = useMemo(() => {
    return fullUnitPrice * quantity
  }, [fullUnitPrice, quantity])

  const discountAmount = useMemo(() => {
    if (!parsedDiscount) return 0
    return (lineTotal * parsedDiscount.value) / 100
  }, [parsedDiscount, lineTotal])

  // Round to 2 decimal places for accurate calculation
  // This recalculates automatically when quantity, modifiers, size, or discount changes
  const total = useMemo(() => {
    return Math.round((Math.max(0, lineTotal - discountAmount)) * 100) / 100
  }, [lineTotal, discountAmount])

  const handleSizeSelect = (size: ProductSize) => {
    setSelectedSize(size)
    setShowSizeDropdown(false)
  }

  const handleModifierToggle = (modifier: Modifier) => {
    setSelectedModifiers(prev => {
      const exists = prev.find(m => m.id === modifier.id)
      if (exists) {
        return prev.filter(m => m.id !== modifier.id)
      }
      return [...prev, modifier]
    })
  }

  const handleAddToCart = () => {
    if (!product) return

    // Check if sizes are available and a size must be selected
    if (availableSizes.length > 0 && !selectedSize) {
      return // Don't add to cart if size is required but not selected
    }

    const cartItem = {
      id: product.id,
      name: product.name,
      // Send the unit price (size price OR base price, NOT base + size)
      price: unitPrice,
      quantity,
      category: product.category,
      image: product.image,
      modifiers: selectedModifiers.map(m => ({ name: m.name, price: m.price })),
      notes: notes.trim() || undefined,
      discount: parsedDiscount?.value,
      discountType: parsedDiscount?.type,
      selectedSize: selectedSize?.name,
    }

    onAddToCart(cartItem)
    onClose()
  }

  // Check if add to cart should be disabled
  const isAddToCartDisabled = availableSizes.length > 0 && !selectedSize

  if (!isOpen || !product) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quantity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Quantity</label>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors font-bold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1
                  setQuantity(Math.max(1, val))
                }}
                className="w-20 h-10 text-center border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              />
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors font-bold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <span className="ml-auto text-base font-semibold text-gray-900">₹{(unitPrice * quantity).toFixed(2)}</span>
            </div>
          </div>

          {/* Size Selection - Simple Dropdown */}
          {availableSizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">Size</label>
                {!selectedSize && (
                  <span className="text-xs text-red-500 font-medium">Required</span>
                )}
              </div>
              <div className="relative size-dropdown-container">
                <button
                  type="button"
                  onClick={() => setShowSizeDropdown(!showSizeDropdown)}
                  className={`w-full px-4 py-3 border-2 rounded-xl text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent flex items-center justify-between gap-2 transition-all duration-200 ${
                    selectedSize
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 shadow-md'
                      : 'bg-white border-gray-300 hover:border-indigo-400 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {selectedSize?.color && (
                      <div 
                        className="w-5 h-5 rounded-full flex-shrink-0 border-2 shadow-sm"
                        style={{ 
                          backgroundColor: selectedSize.color,
                          borderColor: selectedSize.color,
                          boxShadow: `0 2px 8px ${selectedSize.color}40`
                        }}
                      />
                    )}
                    <span className={`truncate font-medium ${selectedSize ? 'text-gray-900' : 'text-gray-500'}`}>
                      {selectedSize ? `${selectedSize.name} – ₹${selectedSize.price.toFixed(2)}` : 'Select size...'}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 ${showSizeDropdown ? 'rotate-180' : ''} ${selectedSize ? 'text-indigo-600' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showSizeDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border-2 border-gray-200 max-h-60 overflow-y-auto backdrop-blur-sm">
                    <div className="py-2">
                      {availableSizes.map((size) => {
                        const isSelected = selectedSize?.id === size.id
                        return (
                          <button
                            key={size.id}
                            type="button"
                            onClick={() => handleSizeSelect(size)}
                            className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center gap-3 ${
                              isSelected
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/30'
                                : 'text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:font-medium'
                            }`}
                          >
                            {size.color && (
                              <div 
                                className={`w-5 h-5 rounded-full flex-shrink-0 border-2 transition-all ${
                                  isSelected ? 'border-white shadow-md' : 'border-gray-300'
                                }`}
                                style={{ 
                                  backgroundColor: size.color,
                                  boxShadow: isSelected ? `0 2px 8px ${size.color}60` : undefined
                                }}
                              />
                            )}
                            <div className="flex items-center justify-between flex-1 min-w-0">
                              <span className="truncate">{size.name}</span>
                              <span className={`ml-2 flex-shrink-0 font-bold ${isSelected ? 'text-white' : 'text-gray-600'}`}>₹{size.price.toFixed(2)}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modifiers - Vertical list matching "Choose your Crust" style */}
          {availableModifiers.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Customise as per your taste</h3>
              <div className="border-t border-gray-200 my-3" />
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-800">Choose your Modifiers</label>
                <span className="text-sm font-semibold text-gray-900">{selectedModifiers.length} selected</span>
              </div>

              {/* Vertical list: white card, each row = green icon | label | radio-style */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {availableModifiers.map((modifier) => {
                    const isSelected = selectedModifiers.some(m => m.id === modifier.id)
                    return (
                      <button
                        key={modifier.id}
                        type="button"
                        onClick={() => handleModifierToggle(modifier)}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50/80 transition-colors"
                      >
                        {/* Green-outlined square with solid green circle (vegetarian-style icon) */}
                        <div className="w-5 h-5 rounded border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        </div>
                        {/* Option label + price */}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-800">{modifier.name}</span>
                          <span className="text-xs text-gray-500 ml-1">₹{modifier.price.toFixed(2)}</span>
                        </div>
                        {/* Radio-style control: orange when selected, grey outline when not */}
                        <div
                          className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                            isSelected
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Discount */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <label className="text-sm font-semibold text-gray-700">Discount</label>
              <span className="text-gray-400 cursor-help" title="Enter discount percentage (e.g. 10 or 10%)">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <input
              type="text"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              placeholder="Discount %"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            />
          </div>

          {/* Preparation Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Preparation note:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white"
            />
          </div>
        </div>

        {/* Sticky Footer: Total + Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-b-2xl flex-shrink-0 shadow-lg z-10">
          {/* Total Price */}
          <div className="px-6 py-3 flex items-center justify-between border-b border-gray-200">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-primary-600">₹{total.toFixed(2)}</span>
          </div>
          
          {/* Action Buttons */}
          <div className="px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAddToCartDisabled}
            className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-all ${
              isAddToCartDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg'
            }`}
          >
            {isAddToCartDisabled 
              ? 'Please select a size' 
              : editingCartItem 
                ? 'Update in Cart' 
                : 'Add to cart'
            }
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}
