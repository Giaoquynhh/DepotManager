import { useState } from 'react';
import { ShippingLine, TransportCompany, ContainerType, PaginatedResponse } from '../../../services/setupService';
import { ShippingLineFormData } from '../components/AddShippingLineModal';
import { TransportCompanyFormData } from '../components/AddTransportCompanyModal';
import { ContainerTypeFormData } from '../components/AddContainerTypeModal';

export const useSetupState = () => {
  // State for shipping lines
  const [shippingLines, setShippingLines] = useState<ShippingLine[]>([]);
  const [shippingLinesPagination, setShippingLinesPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingShippingLine, setEditingShippingLine] = useState<ShippingLine | null>(null);
  const [shippingLineFormData, setShippingLineFormData] = useState<ShippingLineFormData>({
    code: '',
    name: '',
    eir: '',
    note: ''
  });
  const [errorText, setErrorText] = useState('');

  // State for transport companies
  const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
  const [transportCompaniesPagination, setTransportCompaniesPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showAddTransportCompanyModal, setShowAddTransportCompanyModal] = useState(false);
  const [showEditTransportCompanyModal, setShowEditTransportCompanyModal] = useState(false);
  const [showUploadTransportCompanyModal, setShowUploadTransportCompanyModal] = useState(false);
  const [editingTransportCompany, setEditingTransportCompany] = useState<TransportCompany | null>(null);
  const [transportCompanyFormData, setTransportCompanyFormData] = useState<TransportCompanyFormData>({
    code: '',
    name: '',
    address: '',
    mst: '',
    phone: '',
    note: ''
  });
  const [transportCompanyErrorText, setTransportCompanyErrorText] = useState('');

  // State for container types
  const [containerTypes, setContainerTypes] = useState<ContainerType[]>([]);
  const [containerTypesPagination, setContainerTypesPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showAddContainerTypeModal, setShowAddContainerTypeModal] = useState(false);
  const [showEditContainerTypeModal, setShowEditContainerTypeModal] = useState(false);
  const [showUploadContainerTypeModal, setShowUploadContainerTypeModal] = useState(false);
  const [editingContainerType, setEditingContainerType] = useState<ContainerType | null>(null);
  const [containerTypeFormData, setContainerTypeFormData] = useState<ContainerTypeFormData>({
    code: '',
    description: '',
    note: ''
  });
  const [containerTypeErrorText, setContainerTypeErrorText] = useState('');

  // Common state
  const [successMessage, setSuccessMessage] = useState('');

  return {
    // Shipping Lines State
    shippingLines,
    setShippingLines,
    shippingLinesPagination,
    setShippingLinesPagination,
    showAddModal,
    setShowAddModal,
    showEditModal,
    setShowEditModal,
    showUploadModal,
    setShowUploadModal,
    editingShippingLine,
    setEditingShippingLine,
    shippingLineFormData,
    setShippingLineFormData,
    errorText,
    setErrorText,

    // Transport Companies State
    transportCompanies,
    setTransportCompanies,
    transportCompaniesPagination,
    setTransportCompaniesPagination,
    showAddTransportCompanyModal,
    setShowAddTransportCompanyModal,
    showEditTransportCompanyModal,
    setShowEditTransportCompanyModal,
    showUploadTransportCompanyModal,
    setShowUploadTransportCompanyModal,
    editingTransportCompany,
    setEditingTransportCompany,
    transportCompanyFormData,
    setTransportCompanyFormData,
    transportCompanyErrorText,
    setTransportCompanyErrorText,

    // Container Types State
    containerTypes,
    setContainerTypes,
    containerTypesPagination,
    setContainerTypesPagination,
    showAddContainerTypeModal,
    setShowAddContainerTypeModal,
    showEditContainerTypeModal,
    setShowEditContainerTypeModal,
    showUploadContainerTypeModal,
    setShowUploadContainerTypeModal,
    editingContainerType,
    setEditingContainerType,
    containerTypeFormData,
    setContainerTypeFormData,
    containerTypeErrorText,
    setContainerTypeErrorText,

    // Common State
    successMessage,
    setSuccessMessage
  };
};
