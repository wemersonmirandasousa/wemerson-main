import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { matchGptByPrefix, GPT_LINKS, KNOWLEDGE_BASE_LINKS, type GptLink } from '@/lib/gptAutocomplete';
import { ExternalLink } from 'lucide-react';

interface GptLinkInputProps {
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
  category?: 'prompt_builder' | 'knowledge_base' | 'all';
}

const GptLinkInput: React.FC<GptLinkInputProps> = ({ value, onChange, readOnly, className, placeholder, category = 'all' }) => {
  const [suggestions, setSuggestions] = useState<GptLink[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState('');

  const links = category === 'knowledge_base' ? KNOWLEDGE_BASE_LINKS
    : category === 'prompt_builder' ? GPT_LINKS
    : [...GPT_LINKS, ...KNOWLEDGE_BASE_LINKS];

  const handleNameChange = (input: string) => {
    setNameInput(input);
    if (input.length >= 2) {
      const matches = matchGptByPrefix(input, links);
      if (matches.length > 0) {
        setSuggestions(matches);
        setShowSuggestions(true);
        return;
      }
    }
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const acceptSuggestion = (suggestion: GptLink) => {
    onChange(suggestion.url);
    setNameInput(suggestion.name);
    setSelectedUrl(suggestion.url);
    setShowSuggestions(false);
  };

  if (readOnly) {
    return (
      <div className="flex items-center gap-1.5">
        <Input value={value} readOnly className={className} />
        {value && (
          <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent shrink-0">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <Input
          value={nameInput}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Buscar GPT..."
          className={`${className} flex-shrink-0 w-[160px]`}
        />
        <div className="flex items-center gap-1.5 flex-1">
          <Input
            value={value}
            onChange={(e) => { onChange(e.target.value); setShowSuggestions(false); }}
            placeholder={placeholder || 'https://chatgpt.com/g/...'}
            className={`${className} flex-1`}
          />
          {(value || selectedUrl) && (
            <a href={value || selectedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent shrink-0">
              <ExternalLink className="h-3.5 w-3.5 text-primary" />
            </a>
          )}
        </div>
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 z-20 mt-1 w-full rounded-lg border overflow-hidden max-h-[200px] overflow-y-auto" style={{ background: 'hsl(220 15% 13%)', borderColor: 'hsl(152 90% 58% / 0.3)' }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => acceptSuggestion(s)}
              className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-white/5 border-b border-white/5 last:border-b-0"
              style={{ color: 'hsl(152 90% 58%)' }}
            >
              ✓ {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GptLinkInput;
