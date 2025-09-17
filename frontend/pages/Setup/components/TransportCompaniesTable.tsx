// Transport Companies Table component
import React from 'react';
import { Pagination } from '../../../components/Pagination';

export interface TransportCompany {
  id: string;
  code: string;
  name: string;
  address?: string;
  mst?: string;
  phone?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

interface TransportCompaniesTableProps {
  transportCompanies: TransportCompany[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  language: 'vi' | 'en';
  translations: any;
  onEdit: (company: TransportCompany) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}

export const TransportCompaniesTable: React.FC<TransportCompaniesTableProps> = ({
  transportCompanies,
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
            <th>{translations[language].transportCompanyCode}</th>
            <th>{translations[language].transportCompanyName}</th>
            <th>{translations[language].address}</th>
            <th>{translations[language].mst}</th>
            <th>{translations[language].phone}</th>
            <th>{translations[language].note}</th>
            <th>{translations[language].actions}</th>
          </tr>
        </thead>
        <tbody>
          {transportCompanies.map((company) => (
            <tr key={company.id}>
              <td style={{fontFamily:'monospace', fontWeight: '600'}}>
                {company.code}
              </td>
              <td style={{fontWeight: '600'}}>
                {company.name}
              </td>
              <td>
                {company.address || '-'}
              </td>
              <td>
                {company.mst || '-'}
              </td>
              <td>
                {company.phone || '-'}
              </td>
              <td>
                {company.note || '-'}
              </td>
              <td>
                <div style={{display:'flex', gap:8}}>
                  <button 
                    className="btn btn-xs" 
                    onClick={() => onEdit(company)}
                    title={translations[language].edit}
                  >
                    {translations[language].edit}
                  </button>
                  <button 
                    className="btn btn-xs btn-outline" 
                    onClick={() => onDelete(company.id)}
                    title={translations[language].delete}
                    style={{color: '#dc2626', borderColor: '#dc2626'}}
                  >
                    {translations[language].delete}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {transportCompanies.length === 0 && (
            <tr>
              <td colSpan={7} style={{textAlign: 'center', padding: '2rem', color: '#6b7280'}}>
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
