import React from 'react';
import { Search, SlidersHorizontal, Loader2, Inbox, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * DataTable Component
 * A reusable, flexible table component designed with Shadcn/UI and Tailwind CSS style.
 * 
 * Props:
 * - columns: Array of objects { key, label, width, truncate, render(row), align }
 * - data: Array of data objects
 * - keyField: String (default: 'id')
 * - isLoading: Boolean
 * - emptyStateMessage: String
 * - rowActions: Array of objects { icon, label, onClick, show(row), isLoading(row), variant }
 * - toolbarPlaceholder: String
 */

const DataTable = ({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyStateMessage = 'No data available',
  rowActions = [],
  toolbarPlaceholder = 'Search...',
}) => {
  return (
    <div className="w-full space-y-4">
      {/* Search & Filter Toolbar Placeholder */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <input 
            type="text" 
            placeholder={toolbarPlaceholder}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-sm active:scale-95">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Table Card Container */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col relative">
        <div className="overflow-x-auto w-full rounded-xl">
          <table className="w-full text-left border-collapse text-sm">
            {/* Table Header */}
            <thead className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                {columns.map((col, index) => (
                  <th 
                    key={col.key || index} 
                    className={`py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                    style={{ width: col.width || 'auto' }}
                  >
                    {col.label}
                  </th>
                ))}
                {rowActions.length > 0 && (
                  <th className="py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400 text-right sticky right-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm z-10 w-24">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {isLoading ? (
                // Loading State
                <tr>
                  <td colSpan={columns.length + (rowActions.length > 0 ? 1 : 0)} className="py-16 text-center">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                    <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium">Loading data...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={columns.length + (rowActions.length > 0 ? 1 : 0)} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <Inbox className="w-10 h-10 mb-3 stroke-[1.5]" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{emptyStateMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Data Rows
                data.map((row, rowIndex) => (
                  <tr 
                    key={row[keyField] || rowIndex} 
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    {columns.map((col, colIndex) => {
                      const cellValue = col.render ? col.render(row) : row[col.key];
                      return (
                        <td 
                          key={`${rowIndex}-${colIndex}`} 
                          className={`py-3.5 px-4 text-slate-700 dark:text-slate-300 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                        >
                          {col.truncate ? (
                            <div 
                              className="max-w-[200px] sm:max-w-[300px] lg:max-w-[400px] truncate" 
                              title={typeof cellValue === 'string' ? cellValue : undefined}
                            >
                              {cellValue}
                            </div>
                          ) : (
                            cellValue
                          )}
                        </td>
                      );
                    })}

                    {/* Actions Column */}
                    {rowActions.length > 0 && (
                      <td className="py-2 px-4 text-right sticky right-0 bg-white/95 dark:bg-slate-950/95 group-hover:bg-slate-50/95 dark:group-hover:bg-slate-900/95 backdrop-blur-sm transition-colors z-10">
                        <div className="flex items-center justify-end gap-1.5">
                          {rowActions.map((action, actionIndex) => {
                            // Check visibility
                            if (action.show && !action.show(row)) return null;
                            const isActionLoading = action.isLoading && action.isLoading(row);
                            const Icon = action.icon || MoreHorizontal;
                            
                            return (
                              <button
                                key={actionIndex}
                                onClick={() => action.onClick(row)}
                                disabled={isActionLoading}
                                title={action.label}
                                className={`p-1.5 rounded-lg flex items-center justify-center transition-colors active:scale-95
                                  ${isActionLoading ? 'opacity-50 cursor-not-allowed' : ''}
                                  ${action.variant === 'danger' 
                                    ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30' 
                                    : action.variant === 'success'
                                    ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }
                                `}
                              >
                                {isActionLoading ? (
                                  <Loader2 className="w-[18px] h-[18px] animate-spin" />
                                ) : (
                                  <Icon className="w-[18px] h-[18px]" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Placeholder */}
      {!isLoading && data.length > 0 && (
        <div className="flex items-center justify-between px-1 mt-4 text-sm text-slate-500 dark:text-slate-400">
          <div>
            Showing <span className="font-medium text-slate-700 dark:text-slate-200">1</span> to <span className="font-medium text-slate-700 dark:text-slate-200">{data.length}</span> of <span className="font-medium text-slate-700 dark:text-slate-200">{data.length}</span> entries
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium transition-colors border border-indigo-100 dark:border-indigo-800/30">
              1
            </button>
            <button className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors">
              2
            </button>
            <button className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors">
              3
            </button>
            <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
