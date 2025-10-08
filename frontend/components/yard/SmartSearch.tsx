import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { yardApi } from '../../services/yard';

interface SearchSuggestion {
  id: string;
  code: string;
  type: 'container' | 'slot' | 'block';
  status?: string;
  location?: string;
}

interface SmartSearchProps {
  onSearch: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function SmartSearch({ 
  onSearch, 
  onSuggestionSelect,
  placeholder,
  className = "",
  disabled = false
}: SmartSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // 🧠 Smart search with debouncing and fuzzy matching
  const performSearch = useCallback(async (searchQuery: string) => {
    // Trim query
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    
    try {
      // Gọi API thực tế để tìm kiếm container trong bãi
      const data = await yardApi.searchContainers(trimmedQuery, 10);
      const containers = data.containers || [];

      // Chuyển đổi dữ liệu từ API thành format SearchSuggestion
      const realSuggestions: SearchSuggestion[] = containers.map((container: any, index: number) => ({
        id: `container-${index}`,
        code: container.container_no,
        type: 'container' as const,
        status: 'OCCUPIED',
        location: `${container.block_code} - ${container.slot_code}${container.tier ? ` (Tier ${container.tier})` : ''}`
      }));

      setSuggestions(realSuggestions);
      // Don't override showSuggestions here, let input change handle it
    } catch (error: any) {
      console.error('Search error:', error);
      console.log('Error details:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        query: trimmedQuery
      });
      setSuggestions([]);
      // Don't override showSuggestions here
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 🎯 Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Chỉ gọi API khi có ít nhất 1 ký tự
    if (query.trim().length >= 1) {
      debounceRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  // 🎭 Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    // Show suggestions when user types (từ 1 ký tự)
    if (value.length >= 1) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // 🎯 Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        handleSearch(query.trim());
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else {
          handleSearch(query.trim());
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // 🎯 Handle search execution
  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Add to search history
    setSearchHistory(prev => {
      const newHistory = [searchQuery, ...prev.filter(item => item !== searchQuery)];
      return newHistory.slice(0, 10); // Keep only last 10 searches
    });

    onSearch(searchQuery);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  // 🎯 Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.code);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    } else {
      handleSearch(suggestion.code);
    }
  };

  // 🎯 Handle input focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // 🎯 Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🎨 Get suggestion icon
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'container': return '📦';
      case 'slot': return '📍';
      case 'block': return '🏗️';
      default: return '🔍';
    }
  };

  // 🎨 Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'OCCUPIED': return '#ef4444';
      case 'EMPTY': return '#10b981';
      case 'RESERVED': return '#f59e0b';
      case 'UNDER_MAINTENANCE': return '#f97316';
      default: return '#6b7280';
    }
  };

  return (
    <div className={`smart-search-container ${className}`} ref={suggestionsRef}>
      <div className="smart-search-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="smart-search-input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          disabled={disabled}
          autoComplete="off"
          spellCheck="false"
        />
        
        {/* 🎯 Search Button - Simplified */}
        <button
          className="smart-search-button"
          onClick={() => handleSearch(query.trim())}
          disabled={disabled || !query.trim() || isSearching}
        >
          {isSearching ? '⏳' : 'Tìm'}
        </button>
      </div>

      {/* 🎭 Smart Suggestions Dropdown - Simplified */}
      {showSuggestions && (
        <div className="smart-suggestions">
          <div className="suggestions-list">
            {isSearching ? (
              <div className="suggestion-item loading">
                <div className="suggestion-content">
                  <div className="suggestion-code">Đang tìm kiếm...</div>
                </div>
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="suggestion-content">
                    <div className="suggestion-code">{suggestion.code}</div>
                    {suggestion.location && (
                      <div className="suggestion-location">{suggestion.location}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="suggestion-item no-results">
                <div className="suggestion-content">
                  <div className="suggestion-code">Không tìm thấy kết quả</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🎯 Search History - Simplified */}
      {showSuggestions && suggestions.length === 0 && searchHistory.length > 0 && query.length === 0 && (
        <div className="search-history">
          <div className="history-list">
            {searchHistory.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="history-item"
                onClick={() => {
                  setQuery(item);
                  handleSearch(item);
                }}
              >
                <span className="history-text">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
}

