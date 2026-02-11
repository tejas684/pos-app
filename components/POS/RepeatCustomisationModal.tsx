'use client'

interface RepeatCustomisationModalProps {
  isOpen: boolean
  productName: string
  /** e.g. "Hi-fiber • Aged Sourdough" or "Medium • Caeser Salad" */
  customizationSummary: string
  onClose: () => void
  /** Add one more with same customization */
  onRepeat: () => void
  /** Open full customization modal to choose again */
  onIllChoose: () => void
}

export default function RepeatCustomisationModal({
  isOpen,
  productName,
  customizationSummary,
  onClose,
  onRepeat,
  onIllChoose,
}: RepeatCustomisationModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-2 flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600">{productName}</p>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">
              Repeat previous customisation?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Customisation details */}
        <div className="px-6 py-3">
          <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 text-sm text-gray-700">
            <span className="font-medium text-gray-600">Customisation: </span>
            {customizationSummary || 'Default'}
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-6 pt-2 flex gap-3">
          <button
            type="button"
            onClick={onIllChoose}
            className="flex-1 px-4 py-3 font-semibold rounded-xl border-2 border-green-500 text-green-600 hover:bg-green-50 transition-colors"
          >
            I&apos;ll choose
          </button>
          <button
            type="button"
            onClick={onRepeat}
            className="flex-1 px-4 py-3 font-semibold rounded-xl bg-green-500 hover:bg-green-600 text-white transition-colors shadow-md"
          >
            Repeat
          </button>
        </div>
      </div>
    </div>
  )
}
