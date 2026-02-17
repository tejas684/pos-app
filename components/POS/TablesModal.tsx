'use client'

import { useState, useMemo, useEffect } from 'react'
import type { Table } from '@/types/pos'

// Icons: Garden (tree), Hall (building)
const GardenIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V14m-2 0h4M12 10a3 3 0 110 6 3 3 0 010-6z" />
  </svg>
)
const HallIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

interface TablesModalProps {
  isOpen: boolean
  onClose: () => void
  /** Current selected table display string (e.g. "Table 6" or "Table 6, Table 7") */
  selectedTable: string
  tables: Table[]
  /** Called when user confirms: selected table names and number of persons */
  onConfirm: (tableNames: string[], numberOfPersons: number) => void
  /** Initial number of persons when opening modal (e.g. from current order) */
  initialNumberOfPersons?: number
}

export default function TablesModal({
  isOpen,
  onClose,
  selectedTable,
  tables,
  onConfirm,
  initialNumberOfPersons = 0,
}: TablesModalProps) {
  // Areas: from API (unique table.area) or default Garden / Hall
  const areas = useMemo(() => {
    const fromTables = Array.from(new Set(tables.map((t) => t.area).filter(Boolean))) as string[]
    if (fromTables.length > 0) return fromTables.sort()
    return ['Garden', 'Hall']
  }, [tables])

  const [selectedArea, setSelectedArea] = useState<string>(areas[0] ?? 'Garden')
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([])
  const [numberOfPersons, setNumberOfPersons] = useState<string>(String(initialNumberOfPersons || ''))

  // Tables for the selected area (match area; tables with no area show in all areas)
  const tablesInArea = useMemo(() => {
    return tables.filter((t) => {
      if (!t.area) return true
      return t.area === selectedArea
    })
  }, [tables, selectedArea])

  // When modal opens or selectedTable changes, pre-fill selected tables and sync selectedArea
  useEffect(() => {
    if (!isOpen) return
    setNumberOfPersons(String(initialNumberOfPersons || ''))
    if (!selectedTable.trim()) {
      setSelectedArea(areas[0] ?? 'Garden')
      setSelectedTableIds([])
      return
    }
    // Match table names (support "Table 1" or "Garden – Table 1" format)
    const names = selectedTable
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((n) => {
        const parts = n.split(/[–-]/)
        return parts.length > 1 ? parts[1]?.trim() || n : n
      })
    const matchedTables = tables.filter((t) =>
      names.some((n) => n === t.name || n.toLowerCase() === t.name.toLowerCase())
    )
    const ids = matchedTables.map((t) => t.id)
    setSelectedTableIds(ids)
    // Show the area of the selected table so it's visible when reopening
    if (matchedTables.length > 0 && matchedTables[0].area && areas.includes(matchedTables[0].area)) {
      setSelectedArea(matchedTables[0].area)
    } else {
      setSelectedArea(areas[0] ?? 'Garden')
    }
  }, [isOpen, selectedTable, tables, areas, initialNumberOfPersons])

  const selectedTables = useMemo(
    () => tables.filter((t) => selectedTableIds.includes(t.id)),
    [tables, selectedTableIds]
  )
  const totalSeatCapacity = selectedTables.reduce((sum, t) => sum + t.capacity, 0)
  const personsNum = Math.max(0, parseInt(numberOfPersons, 10) || 0)

  const tableRequired = selectedTableIds.length === 0
  const personsRequired = numberOfPersons.trim() === '' || personsNum <= 0
  const isValid = !tableRequired && !personsRequired

  const toggleTable = (table: Table) => {
    if (table.status !== 'available') return
    setSelectedTableIds((prev) =>
      prev.includes(table.id) ? [] : [table.id]
    )
  }

  const handleConfirm = () => {
    if (!isValid) return
    const names = selectedTables.map((t) => t.name)
    onConfirm(names, personsNum)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl ring-1 ring-slate-200/80 w-full max-w-6xl max-h-[88vh] flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white rounded-t-2xl shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Select Tables</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Horizontal layout: left = Area + Tables, right = Capacity + Persons + actions */}
        <div className="flex-1 flex flex-col sm:flex-row min-h-0 overflow-hidden">
          {/* Left: Area + Tables - wider */}
          <div className="flex-1 px-6 py-5 overflow-y-auto border-b sm:border-b-0 sm:border-r border-slate-200 min-w-0">
            <p className="text-sm text-slate-600 mb-3">Select Dine-In Details</p>
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">Select Area</h3>
              <div className="flex flex-wrap gap-3">
                {areas.map((area) => {
                  const isGarden = area.toLowerCase() === 'garden'
                  const Icon = isGarden ? GardenIcon : HallIcon
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setSelectedArea(area)}
                      className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                        selectedArea === area
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {area}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Select Table <span className="text-red-500">*</span></h3>
              <div className="flex flex-wrap gap-3">
                {tablesInArea.map((table) => {
                  const isSelected = selectedTableIds.includes(table.id)
                  const isAvailable = table.status === 'available'
                  const isBooked = !isAvailable
                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => toggleTable(table)}
                      disabled={isBooked}
                      className={`min-w-[4.5rem] px-5 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        isBooked
                          ? 'bg-red-500 border-red-600 text-white cursor-not-allowed shadow-lg shadow-red-500/30 ring-2 ring-red-400/50 ring-offset-2 ring-offset-slate-50'
                          : isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md hover:bg-emerald-700'
                            : 'bg-white border-emerald-500 text-emerald-800 hover:border-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {table.name}
                    </button>
                  )
                })}
                {tablesInArea.length === 0 && (
                  <p className="text-sm text-slate-500 py-2">No tables in this area.</p>
                )}
                {tableRequired && tablesInArea.length > 0 && (
                  <p className="text-xs text-red-600 mt-2">Please select a table</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Capacity + Persons + actions */}
          <div className="w-full sm:w-80 shrink-0 flex flex-col px-6 py-5 bg-white/80 border-t sm:border-t-0 sm:border-l border-slate-200">
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-800">
                Total Seat Capacity: <span className="text-emerald-600 font-bold">{totalSeatCapacity}</span>
              </p>
            </div>
            <div className="mb-5">
              <label htmlFor="number-of-persons" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Number of Persons <span className="text-red-500">*</span>
              </label>
              <input
                id="number-of-persons"
                type="number"
                min={1}
                value={numberOfPersons}
                onChange={(e) => setNumberOfPersons(e.target.value)}
                className={`w-full px-4 py-2.5 border-2 rounded-xl text-slate-900 focus:ring-2 outline-none transition bg-white ${
                  personsRequired ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'
                }`}
                placeholder="Enter number"
                required
              />
              {personsRequired && (
                <p className="mt-1 text-xs text-red-600">Number of persons is required (minimum 1)</p>
              )}
            </div>
            <div className="flex flex-col gap-2 mt-auto pt-4">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!isValid}
                className="w-full px-5 py-3 rounded-xl text-sm font-semibold border-2 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:border-slate-300 border-emerald-600 bg-emerald-600 text-white hover:enabled:bg-emerald-700"
              >
                Confirm Tables
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full px-5 py-2.5 rounded-xl text-sm font-medium border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
