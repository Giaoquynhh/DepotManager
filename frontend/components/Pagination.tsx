import React from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  language: 'vi' | 'en';
  translations: any;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  language,
  translations
}) => {
  // Calculate display range
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, currentPage + 2);
      
      // Always show first page
      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push('...');
        }
      }
      
      // Show pages around current
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Always show last page
      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination-container" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '1rem',
      padding: '1rem 0',
      borderTop: '1px solid #e5e7eb'
    }}>
      {/* Items info */}
      <div className="pagination-info" style={{
        color: '#6b7280',
        fontSize: '0.875rem'
      }}>
        {language === 'vi' 
          ? `${translations.common?.showing || 'Hiển thị'} ${startItem}-${endItem} ${translations.common?.of || 'trong tổng số'} ${totalItems} ${translations.common?.items || 'mục'}`
          : `${translations.common?.showing || 'Showing'} ${startItem}-${endItem} ${translations.common?.of || 'of'} ${totalItems} ${translations.common?.items || 'items'}`
        }
      </div>

      {/* Pagination controls */}
      <div className="pagination-controls" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn btn-sm btn-outline"
          style={{
            opacity: currentPage === 1 ? 0.5 : 1,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          {translations.common?.previous || (language === 'vi' ? 'Trước' : 'Previous')}
        </button>

        {/* Page numbers */}
        <div className="pagination-numbers" style={{
          display: 'flex',
          gap: '0.25rem'
        }}>
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span style={{
                  padding: '0.5rem',
                  color: '#6b7280'
                }}>...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    minWidth: '2.5rem'
                  }}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn btn-sm btn-outline"
          style={{
            opacity: currentPage === totalPages ? 0.5 : 1,
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
        >
          {translations.common?.next || (language === 'vi' ? 'Sau' : 'Next')}
        </button>
      </div>
    </div>
  );
};
