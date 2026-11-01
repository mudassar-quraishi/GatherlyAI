'use client';

import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  Printer,
  User,
} from 'lucide-react';
import { EventDetails, ScheduleItem } from '@/types/event';

interface ScheduleTabProps {
  event: EventDetails;
  onUpdateEvent: (updated: Partial<EventDetails>) => void;
}

export default function ScheduleTab({ event, onUpdateEvent }: ScheduleTabProps) {
  const plan = event.plan;
  const schedule = plan?.eventDaySchedule || [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Partial<ScheduleItem>>({});

  // Add Item state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    activity: '',
    description: '',
    responsiblePerson: '',
    notes: '',
  });

  const handleStartEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setEditItem(item);
  };

  const handleSaveEdit = (itemId: string) => {
    if (!plan) return;
    const updated = schedule.map((s) => (s.id === itemId ? { ...s, ...editItem } : s));
    onUpdateEvent({
      plan: {
        ...plan,
        eventDaySchedule: updated,
      },
    });
    setEditingId(null);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!plan) return;
    const updated = schedule.filter((s) => s.id !== itemId);
    onUpdateEvent({
      plan: {
        ...plan,
        eventDaySchedule: updated,
      },
    });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !newItem.activity.trim()) return;

    const created: ScheduleItem = {
      id: `sched-custom-${Date.now()}`,
      startTime: newItem.startTime,
      endTime: newItem.endTime,
      activity: newItem.activity.trim(),
      description: newItem.description.trim(),
      responsiblePerson: newItem.responsiblePerson.trim() || 'Host',
      notes: newItem.notes.trim(),
    };

    onUpdateEvent({
      plan: {
        ...plan,
        eventDaySchedule: [...schedule, created],
      },
    });

    setNewItem({
      startTime: '10:00 AM',
      endTime: '11:00 AM',
      activity: '',
      description: '',
      responsiblePerson: '',
      notes: '',
    });
    setShowAddModal(false);
  };

  const handlePrintRunSheet = () => {
    window.print();
  };

  if (!plan) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-12 text-center">
        <Clock className="w-12 h-12 text-[#64746D] mx-auto mb-3" />
        <h3 className="text-lg font-bold text-[#1E2922]">No Schedule Run Sheet Available</h3>
        <p className="text-xs text-[#64746D] mt-1">
          Generate an AI or sample plan to establish your celebration day run sheet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#64746D] uppercase tracking-wider">
            Event-Day Run Sheet
          </span>
          <h3 className="text-xl font-serif font-bold text-[#1E2922] mt-0.5">
            {event.name} — Order of Events
          </h3>
          <p className="text-xs text-[#64746D] mt-0.5">
            Chronological schedule for event hosts, emcees, coordinators, and vendors.
          </p>
        </div>

        <div className="no-print flex items-center space-x-3">
          <button
            onClick={handlePrintRunSheet}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] hover:bg-[#F4EFEB] text-xs font-semibold text-[#1E2922] transition-colors"
          >
            <Printer className="w-4 h-4 text-[#64746D]" />
            <span>Print Sheet</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#1C3F30] hover:bg-[#153226] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-[#FDF1EB]" />
            <span>Add Activity</span>
          </button>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <h3 className="text-lg font-bold text-[#1E2922] mb-4">Add Run Sheet Activity</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-activity-start-time" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                    Start Time *
                  </label>
                  <input
                    id="new-activity-start-time"
                    type="text"
                    required
                    placeholder="e.g. 05:00 PM"
                    value={newItem.startTime}
                    onChange={(e) => setNewItem({ ...newItem, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs"
                  />
                </div>

                <div>
                  <label htmlFor="new-activity-end-time" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                    End Time *
                  </label>
                  <input
                    id="new-activity-end-time"
                    type="text"
                    required
                    placeholder="e.g. 06:00 PM"
                    value={newItem.endTime}
                    onChange={(e) => setNewItem({ ...newItem, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new-activity-name" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                  Activity Name *
                </label>
                <input
                  id="new-activity-name"
                  type="text"
                  required
                  placeholder="e.g. Cake Cutting & Champagne Toast"
                  value={newItem.activity}
                  onChange={(e) => setNewItem({ ...newItem, activity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs"
                />
              </div>

              <div>
                <label htmlFor="new-activity-description" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                  Description
                </label>
                <textarea
                  id="new-activity-description"
                  rows={2}
                  placeholder="Specific details, music cue, or staging..."
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-activity-responsible-person" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                    Responsible Person
                  </label>
                  <input
                    id="new-activity-responsible-person"
                    type="text"
                    placeholder="e.g. Emcee & DJ"
                    value={newItem.responsiblePerson}
                    onChange={(e) => setNewItem({ ...newItem, responsiblePerson: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E5DFD5] text-xs"
                  />
                </div>

                <div>
                  <label htmlFor="new-activity-notes" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                    Notes
                  </label>
                  <input
                    id="new-activity-notes"
                    type="text"
                    placeholder="e.g. Keep spotlight ready"
                    value={newItem.notes}
                    onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E5DFD5] text-xs"
                  />
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
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chronological Timeline Stream */}
      <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-6 sm:p-8 shadow-sm print-break-inside-avoid">
        <div className="relative border-l-2 border-[#1C3F30]/20 ml-4 sm:ml-6 space-y-6 sm:space-y-8">
          {schedule.map((item) => {
            const isEditing = editingId === item.id;

            return (
              <div key={item.id} className="relative pl-6 sm:pl-8 group">
                {/* Node circle */}
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#1C3F30] border-4 border-[#FFFFFF] shadow-xs" />

                {isEditing ? (
                  <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#1C3F30] space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <input
                        aria-label={`Start time for ${item.activity}`}
                        type="text"
                        value={editItem.startTime || ''}
                        onChange={(e) => setEditItem({ ...editItem, startTime: e.target.value })}
                        className="p-1.5 rounded border"
                        placeholder="Start Time"
                      />
                      <input
                        aria-label={`End time for ${item.activity}`}
                        type="text"
                        value={editItem.endTime || ''}
                        onChange={(e) => setEditItem({ ...editItem, endTime: e.target.value })}
                        className="p-1.5 rounded border"
                        placeholder="End Time"
                      />
                    </div>
                    <input
                      aria-label={`Activity name for ${item.activity}`}
                      type="text"
                      value={editItem.activity || ''}
                      onChange={(e) => setEditItem({ ...editItem, activity: e.target.value })}
                      className="w-full p-1.5 rounded border text-xs font-semibold"
                      placeholder="Activity"
                    />
                    <textarea
                      aria-label={`Description for ${item.activity}`}
                      rows={2}
                      value={editItem.description || ''}
                      onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      className="w-full p-1.5 rounded border text-xs"
                      placeholder="Description"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 text-xs text-[#64746D]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="px-3 py-1 bg-[#1C3F30] text-white rounded text-xs font-medium"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#C85A32] bg-[#FDF1EB] px-2.5 py-0.5 rounded-md">
                          {item.startTime} – {item.endTime}
                        </span>
                        {item.responsiblePerson && (
                          <span className="text-[11px] font-medium text-[#64746D] flex items-center space-x-1">
                            <User className="w-3 h-3 text-[#1C3F30]" />
                            <span>{item.responsiblePerson}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-[#1E2922] pt-0.5">{item.activity}</h4>
                      <p className="text-xs text-[#64746D] leading-relaxed max-w-2xl">
                        {item.description}
                      </p>

                      {item.notes && (
                        <div className="text-[11px] text-[#B46B08] bg-[#FEF6EB] px-2 py-1 rounded inline-block mt-1">
                          Note: {item.notes}
                        </div>
                      )}
                    </div>

                    <div className="no-print flex items-center space-x-1 self-end sm:self-start opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 rounded hover:bg-[#F4EFEB] text-[#64746D]"
                        title="Edit schedule item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded hover:bg-[#FDF0ED] text-[#C0392B]"
                        title="Delete schedule item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
