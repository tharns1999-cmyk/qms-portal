import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import useStore from '../../../store/useStore';
import NcCapaDetail from '../pages/NcCapaDetail';
import { ncCapaService } from '../services/NcCapaService';
import { ncCapaScreeningService } from '../services/NcCapaScreeningService';

vi.mock('../services/NcCapaService');
vi.mock('../services/NcCapaScreeningService');

describe('NC/CAPA Screening Workflow', () => {
  const mockNc = {
    id: 'nc-99',
    ncNumber: 'NC-2023-0099',
    status: 'SCREENING',
    title: 'Screening Test NC',
    createdBy: 'U002'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('language', 'en');
    useStore.setState({
      currentUser: { id: 'U001', name: 'QA Admin', permissions: ['NC_CAPA_VIEW', 'NC_CAPA_VIEW_ALL', 'NC_CAPA_SCREEN'] },
      masterDepartments: [{ id: 'D01', name: 'QA' }],
      masterUsers: []
    });

    ncCapaService.getById.mockResolvedValue(mockNc);
  });

  const renderComponent = () => render(
    <BrowserRouter>
      <NcCapaDetail />
    </BrowserRouter>
  );

  it('shows screening action panel for authorized users', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText(/QA\/QC Screening/i)).toBeInTheDocument());
    
    expect(screen.getByText(/Accept \(Is NC\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Return for Info/i)).toBeInTheDocument();
    expect(screen.getByText(/Reject \(Not NC\)/i)).toBeInTheDocument();
  });

  it('hides screening action panel if user lacks NC_CAPA_SCREEN', async () => {
    useStore.setState({ currentUser: { id: 'U002', name: 'User', permissions: ['NC_CAPA_VIEW', 'NC_CAPA_VIEW_ALL'] }});
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Screening Test NC/i)).toBeInTheDocument());
    
    expect(screen.queryByText(/Accept \(Is NC\)/i)).not.toBeInTheDocument();
    expect(screen.getByText(/QA\/QC Screening in progress/i)).toBeInTheDocument();
  });

  it('enforces CAPA Required selection for ACCEPT', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Accept \(Is NC\)/i)).toBeInTheDocument());
    
    fireEvent.click(screen.getByText(/Accept \(Is NC\)/i));
    fireEvent.click(screen.getByText(/Confirm Decision/i));

    await waitFor(() => {
      // Must have severity and capa decision
      expect(ncCapaScreeningService.acceptAsNc).not.toHaveBeenCalled();
    });
  });

  it('calls acceptAsNc on successful confirm', async () => {
    ncCapaScreeningService.acceptAsNc.mockResolvedValueOnce({});
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Accept \(Is NC\)/i)).toBeInTheDocument());
    
    fireEvent.click(screen.getByText(/Accept \(Is NC\)/i));
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/Confirm Severity/i), { target: { value: 'HIGH' }});
    fireEvent.click(screen.getByLabelText(/Correction Only is sufficient/i));
    
    fireEvent.click(screen.getByText(/Confirm Decision/i));

    await waitFor(() => {
      expect(ncCapaScreeningService.acceptAsNc).toHaveBeenCalled();
    });
  });
});
