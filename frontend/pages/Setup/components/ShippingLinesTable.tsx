// Shipping Lines Table component
import React from 'react';
import { Pagination } from '../../../components/Pagination';

export interface ShippingLine {
  id: string;
  code: string;
  name: string;
  eir: string;
  template_eir?: string;  // File mẫu cố định
  note?: string;
  createdAt: string;
  updatedAt: string;
}

interface ShippingLinesTableProps {
  shippingLines: ShippingLine[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  language: 'vi' | 'en';
  translations: any;
  onEdit: (shippingLine: ShippingLine) => void;
  onDelete: (id: string) => void;
  onUploadEIR: (shippingLine: { id: string; name: string }) => void;
  onDownloadEIR: (shippingLine: { id: string; name: string }) => void;
  onUpdateTemplate: (shippingLine: { id: string; name: string }) => void;
  onPageChange: (page: number) => void;
}

export const ShippingLinesTable: React.FC<ShippingLinesTableProps> = ({
  shippingLines,
  pagination,
  language,
  translations,
  onEdit,
  onDelete,
  onUploadEIR,
  onDownloadEIR,
  onUpdateTemplate,
  onPageChange
}) => {

  return (
    <div className="table-container">
      <table className="table">
        <thead style={{background: '#f8fafc'}}>
          <tr>
            <th>{translations[language].code}</th>
            <th>{translations[language].name}</th>
            <th>{translations[language].eir}</th>
            <th>{translations[language].note}</th>
            <th>{translations[language].actions}</th>
          </tr>
        </thead>
        <tbody>
          {shippingLines.map((shippingLine) => (
            <tr key={shippingLine.id}>
              <td style={{fontFamily:'monospace', fontWeight: '600'}}>
                {shippingLine.code}
              </td>
              <td style={{fontWeight: '600'}}>
                {shippingLine.name}
              </td>
              <td>
                {shippingLine.template_eir || shippingLine.eir}
              </td>
              <td>
                {shippingLine.note || '-'}
              </td>
              <td>
                <div style={{display:'flex', gap:8, flexWrap: 'wrap'}}>
                  <button 
                    className="btn btn-xs" 
                    onClick={() => onEdit(shippingLine)}
                    title={translations[language].edit}
                  >
                    {translations[language].edit}
                  </button>
                  <button 
                    className="btn btn-xs btn-outline" 
                    onClick={() => onUploadEIR({ id: shippingLine.id, name: shippingLine.name })}
                    title="Upload EIR"
                    style={{color: '#059669', borderColor: '#059669'}}
                  >
                    📄 Upload
                  </button>
                  <button 
                    className="btn btn-xs btn-outline" 
                    onClick={() => onUpdateTemplate({ id: shippingLine.id, name: shippingLine.name })}
                    title="Cập nhật Template"
                    style={{color: '#7c3aed', borderColor: '#7c3aed'}}
                  >
                    🔄 Template
                  </button>
                  {shippingLine.template_eir && (
                    <button 
                      className="btn btn-xs btn-outline" 
                      onClick={() => onDownloadEIR({ id: shippingLine.id, name: shippingLine.name })}
                      title="Download Template EIR"
                      style={{color: '#2563eb', borderColor: '#2563eb'}}
                    >
                      📥 Download
                    </button>
                  )}
                  <button 
                    className="btn btn-xs btn-outline" 
                    onClick={() => onDelete(shippingLine.id)}
                    title={translations[language].delete}
                    style={{color: '#dc2626', borderColor: '#dc2626'}}
                  >
                    {translations[language].delete}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {shippingLines.length === 0 && (
            <tr>
              <td colSpan={5} style={{textAlign: 'center', padding: '2rem', color: '#6b7280'}}>
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
