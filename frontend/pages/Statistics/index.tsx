import React from 'react';
import Head from 'next/head';
import Header from '@components/Header';
import Card from '@components/Card';
import { StatisticsDashboard } from '../../components/statistics/StatisticsDashboard';

const StatisticsPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Thống kê tổng quan - Container Management</title>
        <meta name="description" content="Dashboard thống kê tổng quan hệ thống quản lý container" />
      </Head>
      
      <Header />
      <main className="container">
        <Card title="📊 Thống kê tổng quan" className="statistics-page-card">
          <StatisticsDashboard />
        </Card>
      </main>
    </>
  );
};

export default StatisticsPage;
