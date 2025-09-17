import React from 'react';
import Head from 'next/head';
import Header from '@components/Header';
import Card from '@components/Card';
import { StatisticsDashboard } from '../../components/statistics/StatisticsDashboard';
import { useTranslation } from '../../hooks/useTranslation';
import '../../styles/statistics-page.css';

const StatisticsPage: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <>
      <Head>
        <title>{t('pages.statistics.title')} - Container Management</title>
        <meta name="description" content="Dashboard thống kê tổng quan hệ thống quản lý container" />
      </Head>
      
      <Header />
      <main className="container">
        <Card title={`📊 ${t('pages.statistics.title')}`} className="statistics-page-card">
          <div className="statistics-dashboard-wrapper" style={{ 
            position: 'relative', 
            zIndex: 1,
            overflow: 'hidden',
            borderRadius: '8px',
            background: 'transparent'
          }}>
            <StatisticsDashboard />
          </div>
        </Card>
      </main>
    </>
  );
};

export default StatisticsPage;
