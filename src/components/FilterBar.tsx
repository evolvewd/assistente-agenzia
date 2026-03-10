import type { FilterTipo } from '../types/alerts';

const FILTERS: { value: FilterTipo; label: string }[] = [
  { value: 'tutti', label: 'Tutti' },
  { value: 'scioperi', label: 'Scioperi' },
  { value: 'cancellazioni', label: 'Cancellazioni' },
  { value: 'lavori', label: 'Lavori' },
  { value: 'ritardi', label: 'Ritardi' },
];

interface FilterBarProps {
  current: FilterTipo;
  onFilter: (f: FilterTipo) => void;
}

export function FilterBar({ current, onFilter }: FilterBarProps) {
  return (
    <div className="filter-bar">
      {FILTERS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          className={`filter-pill ${current === value ? 'active' : ''}`}
          onClick={() => onFilter(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
