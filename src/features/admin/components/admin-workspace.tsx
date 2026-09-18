'use client';

import { useState } from 'react';
import { AdminHeader } from './admin-header';
import { OverviewView } from './overview-view';
import { EnquiriesView } from './enquiries-view';
import { CustomersView } from './customers-view';
import { LifecycleView } from './lifecycle-view';
import { PipelineView } from './pipeline-view';
import { StaffView } from './staff-view';
import { ReportsView } from './reports-view';
import { NewEnquiryModal } from './new-enquiry-modal';
import { JobDetailDrawer } from './job-detail-drawer';
import { INITIAL_CUSTOMERS, INITIAL_STAFF, INITIAL_METRICS } from '../mock-data';
import type { AdminTab, CustomerRecord, PipelineStatus } from '../types';

// Tab comes from the URL (?tab=) so the server-rendered sidebar can link straight to a module.
// Switching tabs only changes this prop, so the in-memory records below survive navigation.
export function AdminWorkspace({ activeTab }: { activeTab: AdminTab }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerRecord[]>(INITIAL_CUSTOMERS);
  const [staff] = useState(INITIAL_STAFF);
  const [metrics, setMetrics] = useState(INITIAL_METRICS);

  const [isNewEnquiryOpen, setIsNewEnquiryOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  const handleAddEnquiry = (newRecord: CustomerRecord) => {
    setCustomers((prev) => [newRecord, ...prev]);
    setMetrics((prev) => ({
      ...prev,
      totalNewEnquiries: prev.totalNewEnquiries + 1,
      pendingQuotesCount: prev.pendingQuotesCount + 1,
      pendingQuotesValue: prev.pendingQuotesValue + newRecord.estimateValue,
    }));
  };

  const handleUpdateCustomer = (updated: CustomerRecord) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedCustomer(updated);
  };

  const handleUpdateStatus = (id: string, newStatus: PipelineStatus) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            status: newStatus,
            currentMilestone:
              newStatus === 'Completed'
                ? 5
                : newStatus === 'Work in Progress'
                  ? 4
                  : newStatus === 'Quote Sent'
                    ? 3
                    : newStatus === 'Contacted'
                      ? 2
                      : c.currentMilestone,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      }),
    );
  };

  return (
    // Cancels the layout's <main> padding so the dark workshop palette fills the content area.
    <div className='-m-6 flex min-h-[calc(100svh-3.5rem)] flex-col gap-6 bg-[#0a0c10] p-6 text-slate-200 lg:p-8'>
      <AdminHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenNewEnquiry={() => setIsNewEnquiryOpen(true)}
      />

      {activeTab === 'overview' && (
        <OverviewView metrics={metrics} customers={customers} onSelectCustomer={setSelectedCustomer} />
      )}

      {activeTab === 'enquiries' && (
        <EnquiriesView
          customers={customers}
          onOpenNewEnquiry={() => setIsNewEnquiryOpen(true)}
          onSelectCustomer={setSelectedCustomer}
        />
      )}

      {activeTab === 'customers' && <CustomersView customers={customers} onSelectCustomer={setSelectedCustomer} />}

      {activeTab === 'lifecycle' && (
        <LifecycleView
          customers={customers}
          onSelectCustomer={setSelectedCustomer}
          onUpdateCustomer={handleUpdateCustomer}
        />
      )}

      {activeTab === 'pipeline' && (
        <PipelineView
          customers={customers}
          onSelectCustomer={setSelectedCustomer}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {activeTab === 'staff' && <StaffView staff={staff} />}

      {activeTab === 'reports' && <ReportsView metrics={metrics} customers={customers} />}

      <NewEnquiryModal
        isOpen={isNewEnquiryOpen}
        onClose={() => setIsNewEnquiryOpen(false)}
        onAddEnquiry={handleAddEnquiry}
      />

      <JobDetailDrawer
        record={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onUpdateRecord={handleUpdateCustomer}
      />
    </div>
  );
}
