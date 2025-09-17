// Custom hooks cho UsersPartners
import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { api } from '@services/api';
import { canViewUsersPartners } from '@utils/rbac';
import { User, Partner, Company, UserAction, Language } from '../types';

const fetcher = (url: string) => api.get(url).then(r => r.data);

export const useUsersPartners = (role: string, currentUser: any, language: Language, translations: any) => {
  // State
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [showCompanyUsersModal, setShowCompanyUsersModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [companyUsers, setCompanyUsers] = useState<User[]>([]);
  const [modalInviteToken, setModalInviteToken] = useState<string>('');
  const [showCompanySearch, setShowCompanySearch] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [message, setMessage] = useState('');
  const [lastInviteToken, setLastInviteToken] = useState<string>('');

  // Form states
  const [empFullName, setEmpFullName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empRole, setEmpRole] = useState('HRManager');
  const [partnerFullName, setPartnerFullName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerRole, setPartnerRole] = useState('CustomerUser');
  const [partnerTenantId, setPartnerTenantId] = useState('');
  const [partnerCompanyName, setPartnerCompanyName] = useState('');
  const [userCompanyMap, setUserCompanyMap] = useState<{[key: string]: string}>({});

  // API URLs
  const usersUrl = role === 'CustomerAdmin' && currentUser?.tenant_id 
    ? `/users?tenant_id=${currentUser.tenant_id}&page=1&limit=50`
    : '/users?role=&page=1&limit=50';
  
  const { data: users } = useSWR(canViewUsersPartners(role) ? [usersUrl] : null, ([u]) => fetcher(u));
  // Đã tạm gỡ tính năng Đối tác: không gọi API partners
  const partners = undefined as any;

  // Filter users
  const filteredUsers = (users?.data || []).filter((u: User) => {
    if (role === 'CustomerAdmin') {
      return u.tenant_id === currentUser?.tenant_id;
    }
    return !['CustomerAdmin', 'PartnerAdmin', 'CustomerUser'].includes(u.role);
  });

  // Functions
  const loadAvailableCompanies = async () => {
    try {
      const response = await api.get('/customers?page=1&limit=100');
      setAvailableCompanies(response.data?.data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const selectCompany = (company: Company) => {
    setPartnerCompanyName(company.name);
    setPartnerTenantId(company.id);
    setShowCompanySearch(false);
  };

  const showCompanyUsers = async (_company: any) => {
    // Tạm thời vô hiệu hóa
    return;
  };

  const modalUserAction = async (id: string, action: UserAction) => {
    setMessage(''); 
    setModalInviteToken('');
    try{
      if (action === 'delete') {
        await api.delete(`/users/${id}`);
        setMessage(`Đã ${action} user`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        await api.patch(`/users/${id}/${action}`);
        setMessage(`Đã ${action} user`);
        setTimeout(() => setMessage(''), 3000);
      }
      
      // Refresh danh sách trong modal
      if (selectedCompany) {
        const response = await api.get(`/users?tenant_id=${selectedCompany.id}&page=1&limit=100`);
        setCompanyUsers(response.data?.data || []);
      }
      
      // Refresh bảng chính với URL chính xác
      if (role === 'CustomerAdmin' && currentUser?.tenant_id) {
        mutate([`/users?tenant_id=${currentUser.tenant_id}&page=1&limit=50`]);
      } else {
        mutate(['/users?role=&page=1&limit=50']);
      }
      // partners đã tạm gỡ
    }catch(e:any){ 
      setMessage(e?.response?.data?.message || `Lỗi ${action}`); 
    }
  };

  const userAction = async (id: string, action: UserAction) => {
    setMessage(''); 
    setLastInviteToken('');
    try{
      if (action === 'delete') {
        await api.delete(`/users/${id}`);
        setMessage(`Đã ${action} user`);
      } else {
        await api.patch(`/users/${id}/${action}`);
        setMessage(`Đã ${action} user`);
      }
      // Refresh users với URL chính xác
      if (role === 'CustomerAdmin' && currentUser?.tenant_id) {
        mutate([`/users?tenant_id=${currentUser.tenant_id}&page=1&limit=50`]);
      } else {
        mutate(['/users?role=&page=1&limit=50']);
      }
      // partners đã tạm gỡ
    }catch(e:any){ 
      setMessage(e?.response?.data?.message || `Lỗi ${action}`); 
    }
  };

  const createEmployee = async () => {
    setMessage('');
    if (!empFullName.trim()) {
      setMessage('Vui lòng nhập họ tên');
      return;
    }
    if (!empEmail.trim() || !empEmail.includes('@')) {
      setMessage('Vui lòng nhập email hợp lệ');
      return;
    }
    if (!empPassword.trim() || empPassword.trim().length < 6) {
      setMessage('Vui lòng nhập mật khẩu (≥ 6 ký tự)');
      return;
    }
    try{
      await api.post('/users', { full_name: empFullName.trim(), email: empEmail.trim().toLowerCase(), password: empPassword, role: empRole });
      setShowEmpForm(false);
      setEmpFullName(''); 
      setEmpEmail('');
      setEmpPassword('');
      setMessage(translations[language].employeeCreated);
      mutate(['/users?role=&page=1&limit=50']);
    }catch(e:any){ 
      setMessage(e?.response?.data?.message || translations[language].createEmployeeError); 
    }
  };

  const createPartner = async () => {
    // Tính năng tạm thời gỡ bỏ
    setMessage('Tính năng tạo đối tác sẽ được triển khai lại sau.');
  };

  return {
    // State
    showEmpForm,
    setShowEmpForm,
    showPartnerForm,
    setShowPartnerForm,
    showCompanyUsersModal,
    setShowCompanyUsersModal,
    selectedCompany,
    setSelectedCompany,
    companyUsers,
    setCompanyUsers,
    modalInviteToken,
    setModalInviteToken,
    showCompanySearch,
    setShowCompanySearch,
    availableCompanies,
    setAvailableCompanies,
    message,
    setMessage,
    lastInviteToken,
    setLastInviteToken,
    // Form states
    empFullName,
    setEmpFullName,
    empEmail,
    setEmpEmail,
    empPassword,
    setEmpPassword,
    empRole,
    setEmpRole,
    partnerFullName,
    setPartnerFullName,
    partnerEmail,
    setPartnerEmail,
    partnerRole,
    setPartnerRole,
    partnerTenantId,
    setPartnerTenantId,
    partnerCompanyName,
    setPartnerCompanyName,
    userCompanyMap,
    setUserCompanyMap,
    // Data
    users,
    partners,
    filteredUsers,
    // Functions
    loadAvailableCompanies,
    selectCompany,
    showCompanyUsers,
    modalUserAction,
    userAction,
    createEmployee,
    createPartner
  };
};
