// Container Types Table component
import React from 'react';
import { Pagination } from '../../../components/Pagination';

export interface ContainerType {
  id: string;
  code: string;
  description: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

interface ContainerTypesTableProps {
  containerTypes: ContainerType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  language: 'vi' | 'en';
  translations: any;
  onEdit: (containerType: ContainerType) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}

export const ContainerTypesTable: React.FC<ContainerTypesTableProps> = ({
  containerTypes,
  pagination,
  language,
  translations,
  onEdit,
  onDelete,
  onPageChange
}) => {

  return (
    <div className="table-container">
      <table className="table">
        <thead style={{background: '#f8fafc'}}>
          <tr>
            <th>{translations[language].containerTypeCode}</th>
            <th>{translations[language].description}</th>
            <th>{translations[language].note}</th>
            <th>{translations[language].actions}</th>
          </tr>
        </thead>
        <tbody>
          {containerTypes.map((containerType) => (
            <tr key={containerType.id}>
              <td style={{fontFamily:'monospace', fontWeight: '600'}}>
                {containerType.code}
              </td>
              <td style={{fontWeight: '600'}}>
                {containerType.description}
              </td>
              <td>
                {containerType.note || '-'}
              </td>
              <td>
                <div style={{display:'flex', gap:8}}>
                  <button 
                    className="btn btn-xs" 
                    onClick={() => onEdit(containerType)}
                    title={translations[language].edit}
                  >
                    {translations[language].edit}
                  </button>
                  <button 
                    className="btn btn-xs btn-outline" 
                    onClick={() => onDelete(containerType.id)}
                    title={translations[language].delete}
                    style={{color: '#dc2626', borderColor: '#dc2626'}}
                  >
                    {translations[language].delete}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {containerTypes.length === 0 && (
            <tr>
              <td colSpan={4} style={{textAlign: 'center', padding: '2rem', color: '#6b7280'}}>
                {translations[language].noData}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        itemsPerPage={pagination.limit}
        onPageChange={onPageChange}
        language={language}
        translations={translations}
      />
    </div>
  );
};

