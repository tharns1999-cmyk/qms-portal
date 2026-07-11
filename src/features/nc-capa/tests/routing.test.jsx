import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  NcCapaDashboard,
  NcCapaList,
  NcCapaNew,
  NcCapaMyTasks,
  NcCapaDetail
} from '../index';
import useStore from '../../../store/useStore';
import { vi } from 'vitest';

// Mock the services to avoid real promises hanging or side effects
vi.mock('../services/NcCapaDashboardService', () => ({
  ncCapaDashboardService: {
    getKpis: vi.fn().mockResolvedValue({ open: 1, overdue: 0, critical: 0, total: 1 })
  }
}));

vi.mock('../services/NcCapaService', () => ({
  ncCapaService: {
    getList: vi.fn().mockResolvedValue([{ id: '1', ncNumber: 'NC-2023-001', title: 'Test', status: 'OPEN', severity: 'LOW', createdAt: '2023-01-01' }]),
    getById: vi.fn().mockImplementation((id) => {
      if (id === 'invalid') return Promise.resolve(null);
      return Promise.resolve({ id, ncNumber: 'NC-2023-001', title: 'Test NC', status: 'OPEN', severity: 'LOW', createdAt: '2023-01-01', description: 'desc' });
    }),
    createDraftShell: vi.fn(() => ({}))
  }
}));

vi.mock('../services/NcCapaTaskService', () => ({
  ncCapaTaskService: {
    getMyTasks: vi.fn().mockResolvedValue([])
  }
}));

describe('NC/CAPA Routing', () => {
  beforeEach(() => {
    localStorage.setItem('language', 'en');
    // Setup an admin user to bypass permission blocks for basic routing tests
    useStore.setState({
      currentUser: { id: 'u5', name: 'Admin', permissions: ['NC_CAPA_VIEW', 'NC_CAPA_VIEW_ALL', 'NC_CAPA_CREATE'] }
    });
  });

  const renderWithRouter = (initialEntry) => {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/nc-capa" element={<NcCapaDashboard />} />
          <Route path="/nc-capa/list" element={<NcCapaList />} />
          <Route path="/nc-capa/new" element={<NcCapaNew />} />
          <Route path="/nc-capa/my-tasks" element={<NcCapaMyTasks />} />
          <Route path="/nc-capa/:ncId" element={<NcCapaDetail />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders Dashboard at /nc-capa', async () => {
    await act(async () => {
      renderWithRouter('/nc-capa');
    });
    expect(screen.getByText(/แดชบอร์ด NC\/CAPA|NC\/CAPA Dashboard/i)).toBeInTheDocument();
  });

  it('renders List at /nc-capa/list', async () => {
    await act(async () => {
      renderWithRouter('/nc-capa/list');
    });
    expect(screen.getByText(/รายการ NC\/CAPA|NC\/CAPA List/i)).toBeInTheDocument();
  });

  it('renders New form at /nc-capa/new', async () => {
    await act(async () => {
      renderWithRouter('/nc-capa/new');
    });
    expect(screen.getByText(/สร้าง NC|Create NC/i)).toBeInTheDocument();
  });

  it('renders My Tasks at /nc-capa/my-tasks', async () => {
    await act(async () => {
      renderWithRouter('/nc-capa/my-tasks');
    });
    expect(screen.getByText(/งานของฉัน|My Tasks/i)).toBeInTheDocument();
  });

  it('renders Detail at /nc-capa/:ncId for valid ID', async () => {
    await act(async () => {
      renderWithRouter('/nc-capa/nc-1');
    });
    expect(screen.getByText('NC-2023-001')).toBeInTheDocument();
    expect(screen.getByText('Test NC')).toBeInTheDocument();
  });

  it('renders Not Found at /nc-capa/:ncId for invalid ID', async () => {
    await act(async () => {
      renderWithRouter('/nc-capa/invalid');
    });
    expect(screen.getByText(/Could not load NC record/i)).toBeInTheDocument();
  });
});
