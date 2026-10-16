import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Overview } from '@/pages/Overview';
import { CampusTwin } from '@/pages/CampusTwin';
import { ResourceMonitoring } from '@/pages/ResourceMonitoring';
import { VisionInspector } from '@/pages/VisionInspector';
import { Simulations } from '@/pages/Simulations';
import { AIAdvisor } from '@/pages/AIAdvisor';
import { Reports } from '@/pages/Reports';
import { NotFound } from '@/pages/NotFound';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Overview />} />
        <Route path="campus-twin" element={<CampusTwin />} />
        <Route path="monitoring" element={<ResourceMonitoring />} />
        <Route path="vision-inspector" element={<VisionInspector />} />
        <Route path="simulations" element={<Simulations />} />
        <Route path="ai-advisor" element={<AIAdvisor />} />
        <Route path="reports" element={<Reports />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default App;
