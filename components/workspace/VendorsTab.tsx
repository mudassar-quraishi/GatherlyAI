'use client';

import React, { useState } from 'react';
import {
  Users,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react';
import type { EventDetails, VendorItem, VendorStatus } from '@/types/event';
import { formatCurrency } from '@/lib/budget/calculator';
import { isTaskPriority, isVendorStatus, VENDOR_STATUSES } from '@/lib/events/enumValues';

interface VendorsTabProps {
  event: EventDetails;
  onUpdateEvent: (updated: Partial<EventDetails>) => void;
}

type NewVendorForm = Omit<VendorItem, 'id'>;
type StatusFilter = 'all' | VendorStatus;

function createNewVendorForm(): NewVendorForm {
  return {
    category: 'Catering',
    title: '',
    needDescription: '',
    whyItMatters: '',
    bookingDeadline: '4 weeks before event',
    priority: 'high',
    status: 'needed',
    notes: '',
  };
}

export default function VendorsTab({ event, onUpdateEvent }: VendorsTabProps) {
  const plan = event.plan;
  const vendors = plan?.vendorChecklist || [];

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  // Add vendor modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVendor, setNewVendor] = useState<NewVendorForm>(createNewVendorForm);

  const confirmedCount = vendors.filter((v) => v.status === 'confirmed').length;
  const activeVendors = vendors.filter((v) => v.status !== 'not-required');
  const confirmedPercent =
    activeVendors.length > 0 ? Math.round((confirmedCount / activeVendors.length) * 100) : 0;

  const handleStatusChange = (vendorId: string, newStatus: VendorStatus) => {
    if (!plan) return;
    const updated = vendors.map((v) => (v.id === vendorId ? { ...v, status: newStatus } : v));
    onUpdateEvent({
      plan: {
        ...plan,
        vendorChecklist: updated,
      },
    });
  };

  const handleSaveNotes = (vendorId: string) => {
    if (!plan) return;
    const updated = vendors.map((v) => (v.id === vendorId ? { ...v, notes: editNotes.trim() } : v));
    onUpdateEvent({
      plan: {
        ...plan,
        vendorChecklist: updated,
      },
    });
    setEditingId(null);
  };

  const handleDeleteVendor = (vendorId: string) => {
    if (!plan) return;
    const updated = vendors.filter((v) => v.id !== vendorId);
    onUpdateEvent({
      plan: {
        ...plan,
        vendorChecklist: updated,
      },
    });
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !newVendor.title.trim()) return;

    const created: VendorItem = {
      id: `vendor-custom-${Date.now()}`,
      category: newVendor.category.trim(),
      title: newVendor.title.trim(),
      needDescription: newVendor.needDescription.trim(),
      whyItMatters: newVendor.whyItMatters.trim(),
      bookingDeadline: newVendor.bookingDeadline.trim(),
      priority: newVendor.priority,
      status: newVendor.status,
      notes: newVendor.notes?.trim() ?? '',
    };

    onUpdateEvent({
      plan: {
        ...plan,
        vendorChecklist: [...vendors, created],
      },
    });

    setNewVendor(createNewVendorForm());
    setShowAddModal(false);
  };

  const filteredVendors = vendors.filter((v) => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: VendorStatus) => {
    switch (status) {
      case 'confirmed':
        return 'bg-[#EDF7F0] text-[#2E7D47] border-[#B7E4C7]';
      case 'contacted':
        return 'bg-[#FEF6EB] text-[#B46B08] border-[#FCD34D]';
      case 'not-required':
        return 'bg-[#F4EFEB] text-[#8E9E96] border-[#E5DFD5]';
      default:
        return 'bg-[#FDF0ED] text-[#C0392B] border-[#F5C2B7]';
    }
  };

  if (!plan) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-12 text-center">
        <Users className="w-12 h-12 text-[#64746D] mx-auto mb-3" />
        <h3 className="text-lg font-bold text-[#1E2922]">No Vendor Checklist Available</h3>
        <p className="text-xs text-[#64746D] mt-1">
          Generate an AI or sample plan to establish your supplier checklist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress & Quick Stats Card */}
      <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#64746D] uppercase tracking-wider">
            Supplier Confirmation Readiness
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-bold text-[#1C3F30]">{confirmedPercent}%</span>
            <span className="text-xs text-[#64746D]">
              ({confirmedCount} of {activeVendors.length} essential suppliers confirmed)
            </span>
          </div>
          <div className="w-full sm:w-72 bg-[#F4EFEB] h-2 rounded-full overflow-hidden mt-3">
            <div
              className="bg-[#2E7D47] h-full rounded-full transition-all duration-300"
              style={{ width: `${confirmedPercent}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#1C3F30] hover:bg-[#153226] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#FDF1EB]" />
          <span>Add Supplier Category</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center space-x-2 bg-[#FFFFFF] border border-[#E5DFD5] p-3.5 rounded-xl text-xs overflow-x-auto">
        <span className="font-bold text-[#1E2922] uppercase tracking-wide text-[11px] mr-1">
          Status:
        </span>
        {(['all', ...VENDOR_STATUSES] satisfies StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors whitespace-nowrap ${
              statusFilter === s
                ? 'bg-[#1C3F30] text-white'
                : 'bg-[#F4EFEB] text-[#64746D] hover:bg-[#E5DFD5]'
            }`}
          >
            {s === 'all' ? 'All Suppliers' : s.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <h3 className="text-lg font-bold text-[#1E2922] mb-4">Add Supplier Checklist Item</h3>
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-vendor-category" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                    Category *
                  </label>
                  <input
                    id="new-vendor-category"
                    type="text"
                    required
                    placeholder="e.g. Photography, Flowers"
                    value={newVendor.category}
                    onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs"
                  />
                </div>

                <div>
                  <label htmlFor="new-vendor-title" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                    Title *
                  </label>
                  <input
                    id="new-vendor-title"
                    type="text"
                    required
                    placeholder="e.g. Drone Filmmaker"
                    value={newVendor.title}
                    onChange={(e) => setNewVendor({ ...newVendor, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new-vendor-need" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                  What You Need
                </label>
                <textarea
                  id="new-vendor-need"
                  rows={2}
                  placeholder="Specific service requirements..."
                  value={newVendor.needDescription}
                  onChange={(e) => setNewVendor({ ...newVendor, needDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs"
                />
              </div>

              <div>
                <label htmlFor="new-vendor-why" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                  Why It Matters
                </label>
                <input
                  id="new-vendor-why"
                  type="text"
                  placeholder="Impact on event experience..."
                  value={newVendor.whyItMatters}
                  onChange={(e) => setNewVendor({ ...newVendor, whyItMatters: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-vendor-deadline" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                    Booking Deadline
                  </label>
                  <input
                    id="new-vendor-deadline"
                    type="text"
                    placeholder="e.g. 3 weeks before event"
                    value={newVendor.bookingDeadline}
                    onChange={(e) => setNewVendor({ ...newVendor, bookingDeadline: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E5DFD5] text-xs"
                  />
                </div>

                <div>
                  <label htmlFor="new-vendor-priority" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                    Priority
                  </label>
                  <select
                    id="new-vendor-priority"
                    value={newVendor.priority}
                    onChange={(event) => {
                      const priority = event.currentTarget.value;
                      if (isTaskPriority(priority)) setNewVendor((previous) => ({ ...previous, priority }));
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E5DFD5] text-xs"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#64746D] hover:bg-[#F4EFEB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#1C3F30] hover:bg-[#153226]"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredVendors.map((vendor) => {
          const isEditingNotes = editingId === vendor.id;

          return (
            <div
              key={vendor.id}
              className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-[#1C3F30]/30 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[11px] font-bold text-[#64746D] uppercase tracking-wider">
                      {vendor.category}
                    </span>
                    <h4 className="text-base font-bold text-[#1E2922] mt-0.5">{vendor.title}</h4>
                  </div>

                  <select
                    aria-label={`Status for ${vendor.title}`}
                    value={vendor.status}
                    onChange={(event) => {
                      const status = event.currentTarget.value;
                      if (isVendorStatus(status)) handleStatusChange(vendor.id, status);
                    }}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border capitalize focus:ring-2 focus:ring-[#1C3F30] ${getStatusBadge(
                      vendor.status
                    )}`}
                  >
                    <option value="needed">Needed</option>
                    <option value="contacted">Contacted</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="not-required">Not Required</option>
                  </select>
                </div>

                <div className="space-y-2 mt-3 text-xs text-[#64746D]">
                  <p className="text-[#1E2922] leading-relaxed">
                    <strong className="text-[#1E2922] font-semibold">Requirement: </strong>
                    {vendor.needDescription}
                  </p>
                  <p className="italic text-[#64746D]">
                    <strong className="text-[#64746D] not-italic font-medium">Why it matters: </strong>
                    {vendor.whyItMatters}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F4EFEB]">
                    <div className="flex items-center space-x-1.5 text-[11px] text-[#64746D]">
                      <Clock className="w-3.5 h-3.5 text-[#1C3F30]" />
                      <span>Target Deadline: {vendor.bookingDeadline}</span>
                    </div>

                    {vendor.estimatedCost && (
                      <div className="text-[11px] font-semibold text-[#1E2922]">
                        Est. {formatCurrency(vendor.estimatedCost, event.currency)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes section */}
                <div className="mt-3 pt-3 border-t border-[#F4EFEB]">
                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        aria-label={`Notes for ${vendor.title}`}
                        rows={2}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Add your local supplier notes, contact name, or deposit records..."
                        className="w-full p-2 text-xs rounded-lg border border-[#1C3F30]"
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 text-xs text-[#64746D]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveNotes(vendor.id)}
                          className="px-3 py-1 rounded bg-[#1C3F30] text-white text-xs font-medium"
                        >
                          Save Notes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between text-xs">
                      <div className="text-[#64746D]">
                        <strong className="text-[#1E2922] font-medium">Notes: </strong>
                        {vendor.notes || <span className="italic text-[#8E9E96]">None added</span>}
                      </div>
                      <button
                        onClick={() => {
                          setEditingId(vendor.id);
                          setEditNotes(vendor.notes || '');
                        }}
                        className="text-[#1C3F30] hover:underline text-[11px] font-medium ml-2 flex-shrink-0"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Delete footer */}
              <div className="mt-4 pt-2 border-t border-[#F4EFEB] flex justify-end">
                <button
                  onClick={() => handleDeleteVendor(vendor.id)}
                  className="p-1 rounded text-[#8E9E96] hover:text-[#C0392B] text-xs flex items-center space-x-1"
                  title="Remove from checklist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
