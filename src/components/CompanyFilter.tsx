import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  slug: string | null;
  created_at: string;
  access_password?: string | null;
}

interface CompanyFilterProps {
  companies: Company[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCompanyClick?: (company: Company) => void;
}

const CompanyFilter: React.FC<CompanyFilterProps> = ({ companies, selectedId, onSelect, onCompanyClick }) => {
  const navigate = useNavigate();

  if (companies.length === 0) return null;

  const centered = companies.length <= 3;

  const handleClick = (c: Company) => {
    if (c.slug) {
      // If company has a password, trigger password dialog
      if ((c as any).access_password && onCompanyClick) {
        onCompanyClick(c);
      } else {
        navigate(`/empresa/${c.slug}`);
      }
    } else {
      onSelect(selectedId === c.id ? null : c.id);
    }
  };

  return (
    <div className={`flex gap-3 py-2 ${centered ? 'justify-center' : 'overflow-x-auto scrollbar-none'}`}>
      {companies.map((c) => {
        const active = selectedId === c.id;
        return (
          <button
            key={c.id}
            onClick={() => handleClick(c)}
            className="flex-shrink-0 flex items-center justify-center rounded-[10px] px-3 transition-colors duration-200"
            style={{
              height: 40,
              background: active ? 'rgba(52,245,163,0.08)' : 'rgba(255,255,255,0.04)',
              border: active ? '1px solid #34F5A3' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: active ? '0 0 12px rgba(52,245,163,0.3)' : 'none',
              transform: active ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {c.logo_url ? (
              <img src={c.logo_url} alt={c.name} className="max-h-[28px] object-contain" style={{ maxWidth: 120 }} />
            ) : (
              <span className="text-xs font-semibold text-foreground/80 px-2">{c.name}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CompanyFilter;
