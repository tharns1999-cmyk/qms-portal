import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { NC_STATUS, DocumentImpact, DccLinkageType, DccLinkageStatus, EffectivenessResult } from '../domain/models';
import { mockNcRecords, mockNcDccLinkages } from '../mock/ncCapaMockData';
import { ncCapaDccLinkageService } from '../services/NcCapaDccLinkageService';
import { ncCapaEffectivenessService } from '../services/NcCapaEffectivenessService';
import NcCapaDccLinkageTab from '../components/NcCapaDccLinkageTab';

describe('Phase 11F: NC/CAPA DCC Linkage & Traceability', () => {
  const adminUser = { id: 'U001', name: 'Admin QA', depts: ['QA'], permissions: ['NC_CAPA_ADMIN', 'DCC_ADMIN', 'NC_CAPA_CLOSE', 'NC_CAPA_EFFECTIVENESS_CHECK'] };
  const authorizedUser = { id: 'U002', name: 'Authorizer', depts: ['PD'], permissions: ['NC_CAPA_DCC_LINK_CREATE', 'NC_CAPA_DCC_LINK_REMOVE', 'DCC_NEW_DAR_CREATE', 'DCC_REVISION_DAR_CREATE', 'NC_CAPA_CLOSE', 'NC_CAPA_EFFECTIVENESS_CHECK'] };
  const unauthorizedUser = { id: 'U003', name: 'NoPerms', depts: ['PD'], permissions: ['NC_CAPA_VIEW'] };
  const partialUser = { id: 'U004', name: 'OnlyNcPerm', depts: ['PD'], permissions: ['NC_CAPA_DCC_LINK_CREATE'] }; // lacks DCC perm

  beforeEach(() => {
    mockNcRecords.length = 0;
    mockNcDccLinkages.length = 0;
    useStore.setState({ 
      currentUser: adminUser,
      dars: [
        { id: 'DAR-MOCK-1', darNo: 'DAR-2607-001', title: 'Existing DAR', status: 'DRAFT', confidential: false },
        { id: 'DAR-MOCK-CONF', darNo: 'DAR-CONF-001', title: 'Secret DAR', status: 'DRAFT', confidential: true }
      ],
      periodicReviews: [
        { id: 'PR-1', title: 'Existing PR', status: 'IN_PROGRESS' }
      ],
      notifications: [],
      tasks: [],
      actionLog: [],
      timeline: []
    });
  });

  const createMockNc = (id, status, docImpact) => {
    const nc = {
      id,
      ncNumber: `NC-${id}`,
      title: 'Test NC',
      status,
      capaActionPlan: {
        documentImpactAssessment: docImpact,
        actions: [{ id: 'a1', status: 'VERIFIED', verifiedAt: '2023-10-25T10:00:00Z' }]
      },
      reportedByUserId: 'U002'
    };
    mockNcRecords.push(nc);
    return nc;
  };

  describe('DCC Linkage Service Rules', () => {
    it('creates New Document DAR linkage', () => {
      const nc = createMockNc('nc-link-1', NC_STATUS.ACTION_IN_PROGRESS, DocumentImpact.NEW_DOCUMENT_REQUIRED);
      const linkage = ncCapaDccLinkageService.createDccWorkflow(nc.id, nc.capaActionPlan.documentImpactAssessment, authorizedUser);
      
      expect(linkage.linkageType).toBe(DccLinkageType.NEW_DAR_CREATED);
      expect(linkage.targetStatus).toBe(DccLinkageStatus.IN_PROGRESS);
      
      const store = useStore.getState();
      const createdDar = store.dars.find(d => d.id === linkage.targetId);
      
      // DCC Workflow is created as DRAFT
      expect(createdDar).toBeDefined();
      expect(createdDar.isDraft).toBe(true);
      expect(createdDar.status).toBe('DRAFT');
      expect(createdDar.source).toBe('NC_CAPA');
      expect(createdDar.sourceNcId).toBe(nc.id);
    });

    it('requires DCC permission along with NC permission', () => {
      const nc = createMockNc('nc-link-2', NC_STATUS.ACTION_IN_PROGRESS, DocumentImpact.NEW_DOCUMENT_REQUIRED);
      
      expect(() => {
        ncCapaDccLinkageService.createDccWorkflow(nc.id, nc.capaActionPlan.documentImpactAssessment, partialUser);
      }).toThrow(/Missing DCC permission/);
    });

    it('prevents duplicate active linkages', () => {
      const nc = createMockNc('nc-link-3', NC_STATUS.ACTION_IN_PROGRESS, DocumentImpact.NEW_DOCUMENT_REQUIRED);
      ncCapaDccLinkageService.createDccWorkflow(nc.id, nc.capaActionPlan.documentImpactAssessment, authorizedUser);
      
      expect(() => {
        ncCapaDccLinkageService.createDccWorkflow(nc.id, nc.capaActionPlan.documentImpactAssessment, authorizedUser);
      }).toThrow(/An active linkage already exists/);
    });

    it('links existing DAR correctly and syncs status', () => {
      const nc = createMockNc('nc-link-4', NC_STATUS.ACTION_IN_PROGRESS, DocumentImpact.DOCUMENT_REVISION_REQUIRED);
      const linkage = ncCapaDccLinkageService.linkExistingWorkflow(nc.id, 'DAR-MOCK-1', DccLinkageType.EXISTING_DAR_LINKED, authorizedUser);
      
      expect(linkage.targetId).toBe('DAR-MOCK-1');
      expect(linkage.targetCode).toBe('DAR-2607-001');
      
      const syncedLinkage = ncCapaDccLinkageService.getLinkageForNc(nc.id);
      expect(syncedLinkage.targetStatus).toBe(DccLinkageStatus.IN_PROGRESS);
    });

    it('prevents leaking restricted DCC items on manual entry', () => {
      const nc = createMockNc('nc-link-5', NC_STATUS.ACTION_IN_PROGRESS, DocumentImpact.DOCUMENT_REVISION_REQUIRED);
      
      // AuthorizedUser does not have DCC_ADMIN
      expect(() => {
        ncCapaDccLinkageService.linkExistingWorkflow(nc.id, 'DAR-MOCK-CONF', DccLinkageType.EXISTING_DAR_LINKED, authorizedUser);
      }).toThrow(/DAR not found or unauthorized/);
      
      // AdminUser has DCC_ADMIN
      const link = ncCapaDccLinkageService.linkExistingWorkflow(nc.id, 'DAR-MOCK-CONF', DccLinkageType.EXISTING_DAR_LINKED, adminUser);
      expect(link.targetId).toBe('DAR-MOCK-CONF');
    });

    it('rejects invalid DAR IDs on manual entry', () => {
      const nc = createMockNc('nc-link-6', NC_STATUS.ACTION_IN_PROGRESS, DocumentImpact.DOCUMENT_REVISION_REQUIRED);
      expect(() => {
        ncCapaDccLinkageService.linkExistingWorkflow(nc.id, 'DAR-FAKE-999', DccLinkageType.EXISTING_DAR_LINKED, authorizedUser);
      }).toThrow(/DAR not found or unauthorized/);
    });
  });

  describe('Closure Gate Rules', () => {
    it('allows closure if NO_DOCUMENT_IMPACT', async () => {
      const nc = createMockNc('nc-close-1', NC_STATUS.EFFECTIVENESS_CHECK, DocumentImpact.NO_DOCUMENT_IMPACT);
      
      const checkData = {
        actualCheckDate: '2023-11-01',
        checkMethod: 'Test',
        recurrenceObserved: false,
        result: EffectivenessResult.EFFECTIVE,
        closureComment: 'All good'
      };
      
      const result = await ncCapaEffectivenessService.submitEffectivenessCheck(nc.id, checkData, authorizedUser);
      expect(result.status).toBe(NC_STATUS.CLOSED);
    });

    it('blocks closure if doc impact exists but NO LINK', async () => {
      const nc = createMockNc('nc-close-2', NC_STATUS.EFFECTIVENESS_CHECK, DocumentImpact.DOCUMENT_REVISION_REQUIRED);
      
      const checkData = {
        actualCheckDate: '2023-11-01',
        checkMethod: 'Test',
        recurrenceObserved: false,
        result: EffectivenessResult.EFFECTIVE,
        closureComment: 'All good'
      };
      
      await expect(
        ncCapaEffectivenessService.submitEffectivenessCheck(nc.id, checkData, authorizedUser)
      ).rejects.toThrow(/Closure blocked: Unresolved document impact/);
    });

    it('blocks closure if doc impact exists and link is IN_PROGRESS', async () => {
      const nc = createMockNc('nc-close-3', NC_STATUS.EFFECTIVENESS_CHECK, DocumentImpact.DOCUMENT_REVISION_REQUIRED);
      ncCapaDccLinkageService.createDccWorkflow(nc.id, DocumentImpact.DOCUMENT_REVISION_REQUIRED, authorizedUser);
      
      const checkData = {
        actualCheckDate: '2023-11-01',
        checkMethod: 'Test',
        recurrenceObserved: false,
        result: EffectivenessResult.EFFECTIVE,
        closureComment: 'All good'
      };
      
      await expect(
        ncCapaEffectivenessService.submitEffectivenessCheck(nc.id, checkData, authorizedUser)
      ).rejects.toThrow(/Closure blocked: Unresolved document impact/);
    });

    it('allows closure if doc impact exists and link is COMPLETED', async () => {
      const nc = createMockNc('nc-close-4', NC_STATUS.EFFECTIVENESS_CHECK, DocumentImpact.DOCUMENT_REVISION_REQUIRED);
      const link = ncCapaDccLinkageService.createDccWorkflow(nc.id, DocumentImpact.DOCUMENT_REVISION_REQUIRED, authorizedUser);
      
      // manually complete the DAR in store
      const store = useStore.getState();
      const dar = store.dars.find(d => d.id === link.targetId);
      dar.status = 'COMPLETED';
      
      const checkData = {
        actualCheckDate: '2023-11-01',
        checkMethod: 'Test',
        recurrenceObserved: false,
        result: EffectivenessResult.EFFECTIVE,
        closureComment: 'All good'
      };
      
      const result = await ncCapaEffectivenessService.submitEffectivenessCheck(nc.id, checkData, authorizedUser);
      expect(result.status).toBe(NC_STATUS.CLOSED);
    });

    it('allows closure if OVERRIDDEN with justification', async () => {
      const nc = createMockNc('nc-close-5', NC_STATUS.EFFECTIVENESS_CHECK, DocumentImpact.DOCUMENT_REVISION_REQUIRED);
      
      const checkData = {
        actualCheckDate: '2023-11-01',
        checkMethod: 'Test',
        recurrenceObserved: false,
        result: EffectivenessResult.EFFECTIVE,
        closureComment: 'All good',
        closureOverrideJustification: 'Admin override due to fast track.'
      };
      
      const result = await ncCapaEffectivenessService.submitEffectivenessCheck(nc.id, checkData, adminUser);
      expect(result.status).toBe(NC_STATUS.CLOSED);
    });
  });

  describe('NcCapaDccLinkageTab Rendering', () => {
    it('renders no action required for NO_DOCUMENT_IMPACT', () => {
      const nc = createMockNc('nc-tab-1', NC_STATUS.ACTION_IN_PROGRESS, DocumentImpact.NO_DOCUMENT_IMPACT);
      render(<BrowserRouter><NcCapaDccLinkageTab record={nc} currentUser={authorizedUser} /></BrowserRouter>);
      expect(screen.getByText('No DCC action required for this NC/CAPA.')).toBeInTheDocument();
    });

    it('renders create new document DAR action', () => {
      const nc = createMockNc('nc-tab-2', NC_STATUS.ACTION_IN_PROGRESS, DocumentImpact.NEW_DOCUMENT_REQUIRED);
      render(<BrowserRouter><NcCapaDccLinkageTab record={nc} currentUser={authorizedUser} /></BrowserRouter>);
      expect(screen.getByTestId('create-dcc-workflow-btn')).toHaveTextContent('Create New Document Required Draft');
    });

    it('renders disabled button if missing permission', () => {
      const nc = createMockNc('nc-tab-3', NC_STATUS.ACTION_IN_PROGRESS, DocumentImpact.NEW_DOCUMENT_REQUIRED);
      render(<BrowserRouter><NcCapaDccLinkageTab record={nc} currentUser={unauthorizedUser} /></BrowserRouter>);
      expect(screen.getByTestId('create-dcc-workflow-btn')).toBeDisabled();
      expect(screen.getByText('Missing DCC_LINK_CREATE permission')).toBeInTheDocument();
    });
  });
});
