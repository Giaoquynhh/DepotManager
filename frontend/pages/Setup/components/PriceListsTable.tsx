// Price Lists Table component
import React from 'react';
import { Pagination } from '../../../components/Pagination';
import { formatNumberWithDots } from '../../../utils/numberFormat';

export interface PriceList {
  id: string;
  serviceCode: string;
  serviceName: string;
  type: string;
  price: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

interface PriceListsTableProps {
  priceLists: PriceList[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  language: 'vi' | 'en';
  translations: any;
  onEdit: (priceList: PriceList) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}

export const PriceListsTable: React.FC<PriceListsTableProps> = ({
  priceLists,
  pagination,
  language,
  translations,
  onEdit,
  onDelete,
  onPageChange
}) => {

  const formatPrice = (price: number) => {
    return `${formatNumberWithDots(price)} VNĐ`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Nâng':
        return 'bg-blue-100 text-blue-800';
      case 'Hạ':
        return 'bg-green-100 text-green-800';
      case 'Tồn kho':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="table-container">
      <table className="table">
        <thead style={{background: '#f8fafc'}}>
          <tr>
            <th>{translations[language].serviceCode}</th>
            <th>{translations[language].serviceName}</th>
            <th>{translations[language].type}</th>
            <th>{translations[language].price}</th>
            <th>{translations[language].note}</th>
            <th>{translations[language].actions}</th>
          </tr>
        </thead>
        <tbody>
          {priceLists.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-500">
                {translations[language].noDataFound}
              </td>
            </tr>
          ) : (
            priceLists.map((priceList) => (
              <tr key={priceList.id} className="hover:bg-gray-50">
                <td className="font-medium">{priceList.serviceCode}</td>
                <td>{priceList.serviceName}</td>
                <td>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(priceList.type)}`}>
                    {priceList.type}
                  </span>
                </td>
                <td className="font-semibold text-green-600">
                  {formatPrice(priceList.price)}
                </td>
                <td className="max-w-xs truncate" title={priceList.note || ''}>
                  {priceList.note || '-'}
                </td>
                <td>
                  <div className="flex space-x-2">
                    <button
                      className="btn btn-xs" 
                      onClick={() => onEdit(priceList)}
                      title={translations[language].edit}
                    >
                      {translations[language].edit}
                    </button>
                    <button 
                      className="btn btn-xs btn-outline" 
                      onClick={() => onDelete(priceList.id)}
                      title={translations[language].delete}
                      style={{color: '#dc2626', borderColor: '#dc2626'}}
                    >
                      {translations[language].delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {priceLists.length > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
            showInfo={true}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            language={language}
            translations={translations}
          />
        </div>
      )}
    </div>
  );
};

