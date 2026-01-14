export default function FilterBar({ filters, onFilterChange, sortOptions, currentSort, onSortChange }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Filters */}
        {filters && (
          <div className="flex-1 flex flex-wrap gap-3">
            {filters.map((filter) => (
              <div key={filter.name} className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-400 mb-1">{filter.label}</label>
                {filter.type === 'select' ? (
                  <select
                    value={filter.value || ''}
                    onChange={(e) => onFilterChange(filter.name, e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  >
                    <option value="">Tümü</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : filter.type === 'date' ? (
                  <input
                    type="date"
                    value={filter.value || ''}
                    onChange={(e) => onFilterChange(filter.name, e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                ) : filter.type === 'range' ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filter.value?.min || ''}
                      onChange={(e) => onFilterChange(filter.name, { ...filter.value, min: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filter.value?.max || ''}
                      onChange={(e) => onFilterChange(filter.name, { ...filter.value, max: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={filter.value || ''}
                    onChange={(e) => onFilterChange(filter.name, e.target.value)}
                    placeholder={filter.placeholder}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sort */}
        {sortOptions && (
          <div className="w-full md:w-48">
            <label className="block text-xs text-gray-400 mb-1">Sırala</label>
            <select
              value={currentSort}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Clear Filters */}
        {filters && (
          <button
            onClick={() => filters.forEach(f => onFilterChange(f.name, f.type === 'range' ? {} : ''))}
            className="self-end bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition-all border border-gray-700"
          >
            Temizle
          </button>
        )}
      </div>
    </div>
  );
}
