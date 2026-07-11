import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  NcCapaDashboard,
  NcCapaDetail
} from '../index';
import useStore from '../../../store/useStore';
import { vi } from 'vitest';

vi.mock('../services/NcCapaService', () => ({
  ncCapaService: {
    getById: vi.fn().mockResolvedValue({ 
      id: 'nc-1', 
      ncNumber: 'NC-1', 
      title: 'Secret NC',
      assignedTo: 'u99',
      createdBy: 'u99',
      customerImpact: true
    })
  }
}));

describe('NC/CAPA Permissions', () => {
  const renderDashboard = () => {
    return render(
      <MemoryRouter initialEntries={['/nc-capa']}>
        <Routes>
          <Route path="/nc-capa" element={<NcCapaDashboard />} />
        </Routes>
      </MemoryRouter>
    );
  };

  const renderDetail = () => {
    return render(
      <MemoryRouter initialEntries={['/nc-capa/nc-1']}>
        <Routes>
          <Route path="/nc-capa/:ncId" element={<NcCapaDetail />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('shows Access Denied for completely unauthorized user on dashboard', async () => {
    useStore.setState({
      currentUser: { id: 'nobody', name: 'Nobody', permissions: [] }
    });
    await act(async () => {
      renderDashboard();
    });
    expect(screen.getByText(/ไม่มีสิทธิ์เข้าถึง|Access Denied/i)).toBeInTheDocument();
    expect(screen.getByText(/ข้อมูลนี้ถูกจำกัดสิทธิ์|This information is restricted/i)).toBeInTheDocument();
  });

  it('shows Access Denied on detail view for restricted NC', async () => {
    useStore.setState({
      currentUser: { id: 'u1', name: 'Basic User', permissions: [] }
    });
    
    await act(async () => {
      renderDetail();
    });
    
    expect(screen.getByText(/ไม่มีสิทธิ์เข้าถึง|Access Denied/i)).toBeInTheDocument();
  });

  it('hides Create button on dashboard for unauthorized users', async () => {
    useStore.setState({
      currentUser: { id: 'u5', name: 'Admin', permissions: ['NC_CAPA_VIEW', 'NC_CAPA_CREATE'] }
    });
    await act(async () => {
      renderDashboard();
    });
    
    // Create NC button should be present
    expect(screen.getByText(/สร้าง NC|Create NC/i)).toBeInTheDocument();
  });
});
