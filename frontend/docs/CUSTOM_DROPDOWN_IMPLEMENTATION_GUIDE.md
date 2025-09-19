# Custom Dropdown Implementation Guide

## Tổng quan
Hướng dẫn chi tiết về cách implement custom dropdown với scrollbar trong React/Next.js project.

## File Structure Mapping

### Backend Files
```
backend/
├── modules/setup/
│   ├── shipping-lines.controller.ts     # API controller cho hãng tàu
│   ├── shipping-lines.service.ts        # Business logic cho hãng tàu
│   ├── container-types.controller.ts    # API controller cho loại container
│   ├── container-types.service.ts       # Business logic cho loại container
│   ├── transport-companies.controller.ts # API controller cho nhà xe
│   └── transport-companies.service.ts   # Business logic cho nhà xe
├── prisma/schema.prisma                 # Database schema
└── docs/
    └── CUSTOM_DROPDOWN_SCROLLBAR_FEATURE.md # Backend documentation
```

### Frontend Files
```
frontend/
├── pages/Requests/components/
│   └── CreateLiftRequestModal.tsx       # Main component với custom dropdown
├── services/
│   └── setupService.ts                  # API service calls
├── hooks/
│   └── useTranslation.ts                # Translation hook
└── docs/
    ├── CUSTOM_DROPDOWN_SCROLLBAR_FEATURE.md # Frontend documentation
    └── CUSTOM_DROPDOWN_IMPLEMENTATION_GUIDE.md # Implementation guide
```

## Implementation Steps

### 1. Backend Setup

#### Database Schema (Prisma)
```prisma
model ShippingLine {
  id        String   @id @default(cuid())
  code      String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ContainerType {
  id          String   @id @default(cuid())
  code        String   @unique
  description String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model TransportCompany {
  id        String   @id @default(cuid())
  code      String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Controller Implementation
```typescript
// modules/setup/shipping-lines.controller.ts
@Controller('setup/shipping-lines')
export class ShippingLinesController {
  constructor(private readonly shippingLinesService: ShippingLinesService) {}

  @Get()
  async findAll(@Query() query: PaginationDto) {
    return this.shippingLinesService.findAll(query);
  }
}
```

#### Service Implementation
```typescript
// modules/setup/shipping-lines.service.ts
@Injectable()
export class ShippingLinesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: PaginationDto) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.shippingLine.findMany({
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      this.prisma.shippingLine.count()
    ]);

    return {
      success: true,
      data: {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  }
}
```

### 2. Frontend Setup

#### Service Layer
```typescript
// services/setupService.ts
import { api } from './api';

export interface ShippingLine {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContainerType {
  id: string;
  code: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransportCompany {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export const setupService = {
  getShippingLines: (params: PaginationParams) => 
    api.get<ApiResponse<ShippingLine[]>>('/setup/shipping-lines', { params }),
  
  getContainerTypes: (params: PaginationParams) => 
    api.get<ApiResponse<ContainerType[]>>('/setup/container-types', { params }),
  
  getTransportCompanies: (params: PaginationParams) => 
    api.get<ApiResponse<TransportCompany[]>>('/setup/transport-companies', { params })
};
```

#### Custom Dropdown Component
```typescript
// components/CustomDropdown.tsx
interface CustomDropdownProps {
  options: Array<{ id: string; code: string; name: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: boolean;
  disabled?: boolean;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  error = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.id === value);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="custom-dropdown-container">
      <button
        type="button"
        className={`custom-dropdown-button ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span>
          {selectedOption ? `${selectedOption.code} - ${selectedOption.name}` : placeholder}
        </span>
        <svg className={`custom-dropdown-arrow ${isOpen ? 'open' : ''}`}>
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </button>
      {isOpen && (
        <div className="custom-dropdown-list">
          {options.map(option => (
            <div
              key={option.id}
              className="custom-dropdown-option"
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
            >
              {`${option.code} - ${option.name}`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

#### CSS Styles
```css
/* styles/custom-dropdown.css */
.custom-dropdown-container {
  position: relative;
  width: 100%;
}

.custom-dropdown-button {
  width: 100%;
  text-align: left;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.custom-dropdown-button:hover:not(:disabled) {
  border-color: #cbd5e1;
}

.custom-dropdown-button:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.custom-dropdown-button.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.custom-dropdown-button.disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.6;
}

.custom-dropdown-arrow {
  transition: transform 0.2s ease;
  width: 16px;
  height: 16px;
}

.custom-dropdown-arrow.open {
  transform: rotate(180deg);
}

.custom-dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.custom-dropdown-list::-webkit-scrollbar {
  width: 8px;
}

.custom-dropdown-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.custom-dropdown-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.custom-dropdown-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.custom-dropdown-option {
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #f1f5f9;
}

.custom-dropdown-option:hover {
  background-color: #f8fafc;
}

.custom-dropdown-option:last-child {
  border-bottom: none;
}
```

## Usage Examples

### 1. Basic Usage
```tsx
import { CustomDropdown } from '../components/CustomDropdown';

const MyComponent = () => {
  const [selectedValue, setSelectedValue] = useState('');
  const [options, setOptions] = useState([]);

  return (
    <CustomDropdown
      options={options}
      value={selectedValue}
      onChange={setSelectedValue}
      placeholder="Chọn một tùy chọn"
    />
  );
};
```

### 2. With Error State
```tsx
<CustomDropdown
  options={shippingLines}
  value={formData.shippingLine}
  onChange={(value) => handleInputChange('shippingLine', value)}
  placeholder="Chọn hãng tàu"
  error={!!errors.shippingLine}
/>
```

### 3. With Loading State
```tsx
<CustomDropdown
  options={containerTypes}
  value={formData.containerType}
  onChange={(value) => handleInputChange('containerType', value)}
  placeholder="Chọn loại container"
  disabled={loading}
/>
```

## Testing

### Unit Tests
```typescript
// __tests__/CustomDropdown.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomDropdown } from '../components/CustomDropdown';

describe('CustomDropdown', () => {
  const mockOptions = [
    { id: '1', code: 'TEST', name: 'Test Option' },
    { id: '2', code: 'DEMO', name: 'Demo Option' }
  ];

  it('renders with placeholder', () => {
    render(
      <CustomDropdown
        options={mockOptions}
        value=""
        onChange={() => {}}
        placeholder="Select option"
      />
    );
    expect(screen.getByText('Select option')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(
      <CustomDropdown
        options={mockOptions}
        value=""
        onChange={() => {}}
        placeholder="Select option"
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Test Option')).toBeInTheDocument();
  });

  it('calls onChange when option is selected', () => {
    const mockOnChange = jest.fn();
    render(
      <CustomDropdown
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        placeholder="Select option"
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Test Option'));
    
    expect(mockOnChange).toHaveBeenCalledWith('1');
  });
});
```

## Performance Optimization

### 1. Memoization
```typescript
const CustomDropdown = React.memo<CustomDropdownProps>(({
  options,
  value,
  onChange,
  placeholder,
  error = false,
  disabled = false
}) => {
  // Component implementation
});
```

### 2. Virtual Scrolling (for large lists)
```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedDropdown = ({ options, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);

  const Row = ({ index, style }) => (
    <div style={style}>
      <div
        className="custom-dropdown-option"
        onClick={() => {
          props.onChange(options[index].id);
          setIsOpen(false);
        }}
      >
        {`${options[index].code} - ${options[index].name}`}
      </div>
    </div>
  );

  return (
    <div className="custom-dropdown-container">
      {/* Button implementation */}
      {isOpen && (
        <div className="custom-dropdown-list">
          <List
            height={200}
            itemCount={options.length}
            itemSize={48}
            width="100%"
          >
            {Row}
          </List>
        </div>
      )}
    </div>
  );
};
```

## Accessibility Features

### 1. Keyboard Navigation
```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      setIsOpen(!isOpen);
      break;
    case 'Escape':
      setIsOpen(false);
      break;
    case 'ArrowDown':
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      }
      break;
  }
};

<button
  onKeyDown={handleKeyDown}
  aria-expanded={isOpen}
  aria-haspopup="listbox"
  role="combobox"
>
```

### 2. ARIA Labels
```typescript
<div
  role="listbox"
  aria-label="Shipping lines"
  className="custom-dropdown-list"
>
  {options.map(option => (
    <div
      key={option.id}
      role="option"
      aria-selected={option.id === value}
      className="custom-dropdown-option"
    >
      {`${option.code} - ${option.name}`}
    </div>
  ))}
</div>
```

## Troubleshooting

### Common Issues

1. **Scrollbar not showing**
   - Check if `max-height` is set
   - Verify `overflow-y: auto`
   - Ensure content exceeds container height

2. **Click outside not working**
   - Verify event listener cleanup
   - Check if `dropdownRef` is properly set
   - Ensure `stopPropagation` is not called

3. **Styling conflicts**
   - Check CSS specificity
   - Verify class names are unique
   - Use CSS modules or styled-components

4. **Performance issues**
   - Implement virtualization for large lists
   - Use `React.memo` for optimization
   - Debounce search functionality

### Debug Tips

1. **Console logging**
   ```typescript
   useEffect(() => {
     console.log('Dropdown state:', { isOpen, value, options });
   }, [isOpen, value, options]);
   ```

2. **React DevTools**
   - Use Profiler to check re-renders
   - Monitor component state changes
   - Check for memory leaks

3. **CSS Debugging**
   ```css
   .custom-dropdown-list {
     border: 2px solid red !important; /* Debug border */
   }
   ```


