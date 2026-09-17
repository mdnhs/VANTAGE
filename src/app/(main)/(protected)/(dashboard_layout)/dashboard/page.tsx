'use client';

import { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar, type AdminTab } from '@/features/admin/components/admin-sidebar';
import { AdminHeader } from '@/features/admin/components/admin-header';
import { OverviewView } from '@/features/admin/components/overview-view';
import { EnquiriesView } from '@/features/admin/components/enquiries-view';
import { CustomersView } from '@/features/admin/components/customers-view';
import { LifecycleView } from '@/features/admin/components/lifecycle-view';
import { PipelineView } from '@/features/admin/components/pipeline-view';
import { StaffView } from '@/features/admin/components/staff-view';
import { ReportsView } from '@/features/admin/components/reports-view';
import { NewEnquiryModal } from '@/features/admin/components/new-enquiry-modal';
import { JobDetailDrawer } from '@/features/admin/components/job-detail-drawer';
import { INITIAL_CUSTOMERS, INITIAL_STAFF, INITIAL_METRICS } from '@/features/admin/mock-data';
import type { CustomerRecord, PipelineStatus } from '@/features/admin/types';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerRecord[]>(INITIAL_CUSTOMERS);
  const [staff] = useState(INITIAL_STAFF);
  const [metrics, setMetrics] = useState(INITIAL_METRICS);

  const [isNewEnquiryOpen, setIsNewEnquiryOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  // Handle adding a new enquiry (PDF Module 1 & 2)
  const handleAddEnquiry = (newRecord: CustomerRecord) => {
    setCustomers((prev) => [newRecord, ...prev]);
    setMetrics((prev) => ({
      ...prev,
      totalNewEnquiries: prev.totalNewEnquiries + 1,
      pendingQuotesCount: prev.pendingQuotesCount + 1,
      pendingQuotesValue: prev.pendingQuotesValue + newRecord.estimateValue,
    }));
  };

  // Handle updating a customer record (e.g. status change, notes, milestone advance)
  const handleUpdateCustomer = (updated: CustomerRecord) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedCustomer(updated);
  };

  // Handle quick pipeline status transition
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

  // Calculate dynamic counts
  const enquiriesCount = customers.length;
  const activeJobsCount = customers.filter((c) => c.status === 'Work in Progress' || c.status === 'Approved').length;

  return (
    <TooltipProvider delay={100}>
      <SidebarProvider defaultOpen={false}>
        <div className='flex min-h-screen w-full bg-[#0a0c10] text-slate-200'>
          {/* shadcn UI AppSidebar with the 6 workflow menus */}
          <AppSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            enquiriesCount={enquiriesCount}
            activeJobsCount={activeJobsCount}
          />

          {/* Main Content Inset */}
          <SidebarInset className='flex min-w-0 flex-1 flex-col bg-[#0a0c10]'>
            <AdminHeader
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onOpenNewEnquiry={() => setIsNewEnquiryOpen(true)}
            />

            {/* View Body */}
            <main className='flex-1 p-6 lg:p-8'>
              {activeTab === 'overview' && (
                <OverviewView
                  metrics={metrics}
                  customers={customers}
                  onSelectCustomer={(c) => setSelectedCustomer(c)}
                />
              )}

              {activeTab === 'enquiries' && (
                <EnquiriesView
                  customers={customers}
                  onOpenNewEnquiry={() => setIsNewEnquiryOpen(true)}
                  onSelectCustomer={(c) => setSelectedCustomer(c)}
                />
              )}

              {activeTab === 'customers' && (
                <CustomersView customers={customers} onSelectCustomer={(c) => setSelectedCustomer(c)} />
              )}

              {activeTab === 'lifecycle' && (
                <LifecycleView
                  customers={customers}
                  onSelectCustomer={(c) => setSelectedCustomer(c)}
                  onUpdateCustomer={handleUpdateCustomer}
                />
              )}

              {activeTab === 'pipeline' && (
                <PipelineView
                  customers={customers}
                  onSelectCustomer={(c) => setSelectedCustomer(c)}
                  onUpdateStatus={handleUpdateStatus}
                />
              )}

              {activeTab === 'staff' && <StaffView staff={staff} />}

              {activeTab === 'reports' && <ReportsView metrics={metrics} customers={customers} />}
            </main>
          </SidebarInset>

          {/* New Enquiry Modal (PDF Module 1 & 2) */}
          <NewEnquiryModal
            isOpen={isNewEnquiryOpen}
            onClose={() => setIsNewEnquiryOpen(false)}
            onAddEnquiry={handleAddEnquiry}
          />

          {/* Customer & Job Detail Drawer (PDF Module 2 & 3) */}
          <JobDetailDrawer
            record={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
            onUpdateRecord={handleUpdateCustomer}
          />
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
