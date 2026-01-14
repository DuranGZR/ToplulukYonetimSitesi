export default function FormSelect({ 
  label, 
  name, 
  value, 
  onChange, 
  onBlur,
  error, 
  touched,
  options = [],
  placeholder = 'Seçiniz...',
  required,
  disabled,
  className = '',
  ...props 
}) {
  const showError = touched && error;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur && onBlur(name)}
        disabled={disabled}
        className={`
          w-full bg-gray-900 text-white border rounded-lg px-4 py-3
          focus:outline-none focus:ring-2 transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${showError 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
            : 'border-gray-700 focus:border-red-600 focus:ring-red-600/20'
          }
          ${className}
        `}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {showError && (
        <p className="text-red-500 text-sm flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
