'use client'

import { useState, useCallback, useEffect } from 'react'

/** Form data for Add Customer – matches API api/store/customers (name, last_name, mobile) */
export interface AddCustomerFormData {
  name: string
  last_name: string
  mobile: string
}

export interface CustomerToEdit {
  id: string
  name: string
  phone: string
  last_name?: string
  email?: string
  sameOrDifferentState?: string
  deliveryAddress?: string
  dateOfBirth?: string
  dateOfAnniversary?: string
  defaultDiscount?: string
  gstNumber?: string
}

interface AddCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AddCustomerFormData) => void
  customerToEdit?: CustomerToEdit | null
}

const initialState: AddCustomerFormData = {
  name: '',
  last_name: '',
  mobile: '',
}

export default function AddCustomerModal({
  isOpen,
  onClose,
  onSubmit,
  customerToEdit,
}: AddCustomerModalProps) {
  const [form, setForm] = useState<AddCustomerFormData>(initialState)
  const [errors, setErrors] = useState<Partial<Record<keyof AddCustomerFormData, string>>>({})

  // Load customer data when editing
  useEffect(() => {
    if (customerToEdit && isOpen) {
      setForm({
        name: (customerToEdit.name ?? '').trim(),
        last_name: (customerToEdit.last_name ?? '').trim(),
        mobile: customerToEdit.phone || '',
      })
      setErrors({})
    } else if (!customerToEdit && isOpen) {
      setForm(initialState)
      setErrors({})
    }
  }, [customerToEdit, isOpen])

  const update = useCallback((field: keyof AddCustomerFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const validate = (): boolean => {
    const next: Partial<Record<keyof AddCustomerFormData, string>> = {}
    if (!form.name.trim()) next.name = 'Required'
    if (!form.mobile.trim()) next.mobile = 'Required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit(form)
    setForm(initialState)
    setErrors({})
    onClose()
  }

  const handleClose = () => {
    setForm(initialState)
    setErrors({})
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose()
  }

  if (!isOpen) return null

  const inputBase =
    'w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white'
  const inputError = 'border-red-400'
  const labelBase = 'block text-sm font-semibold text-gray-700 mb-1.5'

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {customerToEdit ? 'Edit Customer' : 'Add Customer'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className={labelBase}>
                First name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. Aishwarya"
                className={`${inputBase} ${errors.name ? inputError : 'border-gray-300'}`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className={labelBase}>Last name</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => update('last_name', e.target.value)}
                placeholder="e.g. Pharande"
                className={`${inputBase} ${errors.last_name ? inputError : 'border-gray-300'}`}
              />
              {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>}
            </div>

            <div>
              <label className={labelBase}>
                Mobile <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={form.mobile}
                onChange={(e) => update('mobile', e.target.value)}
                placeholder="e.g. 1236547890"
                className={`${inputBase} ${errors.mobile ? inputError : 'border-gray-300'}`}
              />
              {errors.mobile && <p className="mt-1 text-xs text-red-500">{errors.mobile}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold text-sm hover:from-primary-700 hover:to-primary-800 shadow-md transition-all"
            >
              {customerToEdit ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
