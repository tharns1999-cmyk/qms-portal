import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import useStore from '../../../store/useStore';
import NcCapaNew from '../pages/NcCapaNew';
import { ncCapaService } from '../services/NcCapaService';

// Mock dependencies
vi.mock('../services/NcCapaService', () => ({
  ncCapaService: {
    createDraftShell: vi.fn(() => ({ id: 'DRAFT-123', status: 'DRAFT' })),
    saveDraft: vi.fn(),
    submitNewNc: vi.fn(),
    reset: vi.fn()
  }
}));

describe('NC/CAPA Intake Wizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('language', 'en');
    useStore.setState({
      currentUser: { id: 'U002', name: 'User', permissions: ['NC_CAPA_CREATE'] },
      masterDepartments: [{ id: 'D01', name: 'QA' }]
    });
  });

  const renderComponent = () => render(
    <BrowserRouter>
      <NcCapaNew />
    </BrowserRouter>
  );

  it('renders stepper and blocks next on invalid step 1', async () => {
    renderComponent();
    expect(screen.getAllByText(/Source and Detection/i)[0]).toBeInTheDocument();
    
    // Try next without filling
    const nextBtn = screen.getByText(/Next/i);
    fireEvent.click(nextBtn);

    expect(screen.getByText(/Please complete required fields/i)).toBeInTheDocument();
  });

  it('allows saving draft at any step', async () => {
    ncCapaService.saveDraft.mockResolvedValueOnce({});
    renderComponent();
    
    const saveBtn = screen.getByText(/Save Draft/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(ncCapaService.saveDraft).toHaveBeenCalled();
    });
  });

  it('submits NC if all validations pass', async () => {
    ncCapaService.submitNewNc.mockResolvedValueOnce({ id: 'NC1', ncNumber: 'NC-2023-0004' });
    renderComponent();
    
    // Fill Step 1
    fireEvent.change(screen.getByLabelText(/NC Source/i), { target: { value: 'INTERNAL_AUDIT' }});
    fireEvent.change(screen.getByLabelText(/Detected Date/i), { target: { value: '2023-10-10' }});
    fireEvent.change(screen.getByLabelText(/Department/i), { target: { value: 'D01' }});
    fireEvent.click(screen.getByText(/Next/i));

    // Fill Step 2
    fireEvent.change(screen.getByPlaceholderText(/Brief title/i), { target: { value: 'Test Title' }});
    fireEvent.change(screen.getByPlaceholderText(/Detailed description/i), { target: { value: 'Test Desc' }});
    fireEvent.click(screen.getByText(/Next/i));

    // Fill Step 3
    fireEvent.change(screen.getByLabelText(/Immediate Correction/i), { target: { value: 'Fixed' }});
    fireEvent.click(screen.getByLabelText(/Containment Not Required/i));
    fireEvent.change(screen.getByPlaceholderText(/Why is containment not required/i), { target: { value: 'N/A' }});
    fireEvent.click(screen.getByText(/Next/i));

    // Fill Step 4
    fireEvent.click(screen.getByLabelText(/High/i));
    fireEvent.click(screen.getByText(/Next/i));

    // Skip Step 5
    fireEvent.click(screen.getByText(/Next/i));

    // Submit Step 6
    const submitBtn = screen.getByText(/Submit NC/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(ncCapaService.submitNewNc).toHaveBeenCalled();
    });
  });
});
