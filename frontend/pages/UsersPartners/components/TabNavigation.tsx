// Tab Navigation component
import React from 'react';
import { ActiveTab, Language } from '../types';

interface TabNavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  role: string;
  language: Language;
  translations: any;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  setActiveTab,
  role,
  language,
  translations
}) => {
  // Partners tab đã được chuyển sang Setup/Customers
  // Chỉ hiển thị Users tab cho tất cả roles
  return null;
};
