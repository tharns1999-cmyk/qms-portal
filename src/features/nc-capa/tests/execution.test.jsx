import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import NcCapaEvidenceTab from '../components/NcCapaEvidenceTab';
import NcCapaQaVerificationTab from '../components/NcCapaQaVerificationTab';
import useStore from '../../../store/useStore';

vi.mock('../../../store/useStore', () => ({
  default: vi.fn(),
}));

describe('NC/CAPA Execution and Verification Tabs', () => {
  const mockAction = {
    id: 'a1',
    description: 'Fix issue',
    responsibleUserId: 'U002',
    status: 'IN_PROGRESS',
    progressPercent: 50,
    evidenceRequired: true,
  };

  const mockRecord = {
    id: 'nc-1',
    status: 'ACTION_IN_PROGRESS',
    capaActionPlan: {
      actions: [mockAction]
    }
  };

  beforeEach(() => {
    useStore.mockReturnValue({
      currentUser: { id: 'U002', name: 'User 2', permissions: ['NC_CAPA_ACTION_EXECUTE', 'NC_CAPA_EVIDENCE_SUBMIT', 'NC_CAPA_VERIFY'] },
      masterUsers: [{ id: 'U002', name: 'User 2' }],
      checkPermission: vi.fn().mockReturnValue(true)
    });
  });

  it('renders EvidenceTab correctly', () => {
    render(
      <NcCapaEvidenceTab 
        record={mockRecord}
        onUpdateProgress={vi.fn()}
        onSubmitForVerification={vi.fn()}
        isReadOnly={false}
      />
    );
    expect(screen.getByText(/Action Execution & Evidence Submission/i)).toBeInTheDocument();
    expect(screen.getByText(/Fix issue/i)).toBeInTheDocument();
    expect(screen.getByText(/50%/i)).toBeInTheDocument();
  });

  it('renders QaVerificationTab correctly', () => {
    const verificationRecord = {
      ...mockRecord,
      capaActionPlan: {
        actions: [
          { ...mockAction, status: 'EVIDENCE_SUBMITTED', evidenceMetadata: { filename: 'test.pdf', sizeBytes: 100 } }
        ]
      }
    };
    render(
      <NcCapaQaVerificationTab 
        record={verificationRecord}
        onVerifyAction={vi.fn()}
        isReadOnly={false}
      />
    );
    expect(screen.getByText(/QA Verification/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending QA Verification/i)).toBeInTheDocument();
    expect(screen.getByText(/test.pdf/i)).toBeInTheDocument();
  });
});
