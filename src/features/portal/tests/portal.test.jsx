import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PortalLandingPage from '../pages/PortalLandingPage';
import useStore from '../../../store/useStore';
import { vi } from 'vitest';

vi.mock('../../nc-capa/services/NcCapaAccessService', () => ({
  ncCapaAccessService: {
    hasPermission: vi.fn().mockReturnValue(true) // assume full permission for testing
  }
}));

describe('Portal Architecture & Landing Page', () => {
  beforeEach(() => {
    localStorage.setItem('language', 'en');
    useStore.setState({
      currentUser: { id: 'u1', name: 'Tester', department: 'Test Dept', permissions: ['NC_CAPA_VIEW'] }
    });
  });

  it('renders Portal Landing Page with module cards', () => {
    render(
      <MemoryRouter initialEntries={['/portal']}>
        <Routes>
          <Route path="/portal" element={<PortalLandingPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Check main title
    expect(screen.getByText('QMS Portal')).toBeInTheDocument();
    expect(screen.getByText('Quality Management System Portal')).toBeInTheDocument();

    // Check modules
    expect(screen.getByText('DCC / Document Control')).toBeInTheDocument();
    expect(screen.getByText('NC / CAPA')).toBeInTheDocument();
    expect(screen.getByText('Internal Audit')).toBeInTheDocument();
    
    // Check coming soon statuses for future modules
    const comingSoonBadges = screen.getAllByText('Coming Soon');
    expect(comingSoonBadges.length).toBeGreaterThan(0);
  });
});
