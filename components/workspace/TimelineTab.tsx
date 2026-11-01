'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Check,
  User,
} from 'lucide-react';
import { EventDetails, TimelineTask, TaskStatus, TaskPriority, TaskStage } from '@/types/event';
import { getStageLabel } from '@/lib/timeline/calculator';

interface TimelineTabProps {
  event: EventDetails;
  onUpdateEvent: (updated: Partial<EventDetails>) => void;
}

export default function TimelineTab({ event, onUpdateEvent }: TimelineTabProps) {
  const plan = event.plan;
  const tasks = plan?.timelineTasks || [];

  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Edit task state
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editOwner, setEditOwner] = useState('');

  // Add task state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    stage: 'early-preparations' as TaskStage,
    dueDate: event.date,
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
    owner: '',
  });

  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Toggle completion
  const handleToggleTaskStatus = (task: TimelineTask) => {
    if (!plan) return;
    const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    const updatedTasks = tasks.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t));

    onUpdateEvent({
      plan: {
        ...plan,
        timelineTasks: updatedTasks,
      },
    });
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (!plan) return;
    const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
    onUpdateEvent({
      plan: {
        ...plan,
        timelineTasks: updatedTasks,
      },
    });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!plan) return;
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    onUpdateEvent({
      plan: {
        ...plan,
        timelineTasks: updatedTasks,
      },
    });
  };

  const handleStartEdit = (task: TimelineTask) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDate(task.dueDate);
    setEditPriority(task.priority);
    setEditOwner(task.owner || '');
  };

  const handleSaveEdit = (taskId: string) => {
    if (!plan) return;
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          title: editTitle.trim(),
          dueDate: editDate,
          priority: editPriority,
          owner: editOwner.trim(),
        };
      }
      return t;
    });

    onUpdateEvent({
      plan: {
        ...plan,
        timelineTasks: updatedTasks,
      },
    });
    setEditingTaskId(null);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !newTask.title.trim()) return;

    const created: TimelineTask = {
      id: `task-custom-${Date.now()}`,
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      stage: newTask.stage,
      dueDate: newTask.dueDate || event.date,
      priority: newTask.priority,
      status: newTask.status,
      owner: newTask.owner.trim(),
    };

    onUpdateEvent({
      plan: {
        ...plan,
        timelineTasks: [...tasks, created],
      },
    });

    setNewTask({
      title: '',
      description: '',
      stage: 'early-preparations',
      dueDate: event.date,
      priority: 'medium',
      status: 'todo',
      owner: '',
    });
    setShowAddModal(false);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  // Group by stage
  const stagesOrder: TaskStage[] = [
    'initial-planning',
    'early-preparations',
    'month-before',
    'final-week',
    'day-before',
    'event-day',
    'post-event',
  ];

  if (!plan) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-12 text-center">
        <Clock className="w-12 h-12 text-[#64746D] mx-auto mb-3" />
        <h3 className="text-lg font-bold text-[#1E2922]">No Timeline Plan Available</h3>
        <p className="text-xs text-[#64746D] mt-1">
          Click &quot;Generate Plan with AI&quot; or &quot;Load Sample Plan&quot; to build your event timeline.
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
            Preparation Progress
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-bold text-[#1C3F30]">{progressPercent}%</span>
            <span className="text-xs text-[#64746D]">
              ({completedCount} of {tasks.length} tasks completed)
            </span>
          </div>
          <div className="w-full sm:w-72 bg-[#F4EFEB] h-2 rounded-full overflow-hidden mt-3">
            <div
              className="bg-[#2E7D47] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#1C3F30] hover:bg-[#153226] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#FDF1EB]" />
          <span>Add Custom Task</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF] border border-[#E5DFD5] p-4 rounded-xl text-xs">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="font-bold text-[#1E2922] uppercase tracking-wide text-[11px] mr-1">
            Status:
          </span>
          {(['all', 'todo', 'in-progress', 'done'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-[#1C3F30] text-white'
                  : 'bg-[#F4EFEB] text-[#64746D] hover:bg-[#E5DFD5]'
              }`}
            >
              {s === 'all' ? 'All' : s.replace('-', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-bold text-[#1E2922] uppercase tracking-wide text-[11px]">
            Priority:
          </span>
          {(['all', 'high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${
                priorityFilter === p
                  ? 'bg-[#1C3F30] text-white'
                  : 'bg-[#F4EFEB] text-[#64746D] hover:bg-[#E5DFD5]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <h3 className="text-lg font-bold text-[#1E2922] mb-4">Add New Timeline Task</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label htmlFor="new-task-title" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                  Task Title *
                </label>
                <input
                  id="new-task-title"
                  type="text"
                  required
                  placeholder="e.g. Schedule final tasting with caterer"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5DFD5] text-xs focus:ring-2 focus:ring-[#1C3F30] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="new-task-description" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                  Description
                </label>
                <textarea
                  id="new-task-description"
                  rows={2}
                  placeholder="Key instructions or contacts..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5DFD5] text-xs focus:ring-2 focus:ring-[#1C3F30] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-task-due-date" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                    Due Date
                  </label>
                  <input
                    id="new-task-due-date"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E5DFD5] text-xs"
                  />
                </div>

                <div>
                  <label htmlFor="new-task-stage" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                    Stage
                  </label>
                  <select
                    id="new-task-stage"
                    value={newTask.stage}
                    onChange={(e) => setNewTask({ ...newTask, stage: e.target.value as TaskStage })}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E5DFD5] text-xs"
                  >
                    {stagesOrder.map((st) => (
                      <option key={st} value={st}>
                        {getStageLabel(st)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-task-priority" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                    Priority
                  </label>
                  <select
                    id="new-task-priority"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E5DFD5] text-xs"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="new-task-owner" className="block text-xs font-bold text-[#1E2922] uppercase mb-1">
                    Owner / Responsible
                  </label>
                  <input
                    id="new-task-owner"
                    type="text"
                    placeholder="e.g. Lead Host, Sibling"
                    value={newTask.owner}
                    onChange={(e) => setNewTask({ ...newTask, owner: e.target.value })}
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
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task List Grouped by Stage */}
      <div className="space-y-6">
        {stagesOrder.map((stage) => {
          const stageTasks = filteredTasks.filter((t) => t.stage === stage);
          if (stageTasks.length === 0) return null;

          return (
            <div key={stage} className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-[#FAF8F5] px-6 py-3.5 border-b border-[#E5DFD5] flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#1E2922]">
                  {getStageLabel(stage)}
                </h4>
                <span className="text-xs text-[#64746D]">
                  {stageTasks.filter((t) => t.status === 'done').length}/{stageTasks.length} done
                </span>
              </div>

              <div className="divide-y divide-[#F4EFEB]">
                {stageTasks.map((task) => {
                  const isEditing = editingTaskId === task.id;
                  const isDone = task.status === 'done';

                  return (
                    <div
                      key={task.id}
                      className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                        isDone ? 'bg-[#FAF8F5]/50' : 'hover:bg-[#FAF8F5]/30'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5 flex-1">
                        {/* Checkbox button */}
                        <button
                          type="button"
                          onClick={() => handleToggleTaskStatus(task)}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all focus:outline-none ${
                            isDone
                              ? 'bg-[#2E7D47] border-[#2E7D47] text-white'
                              : 'border-[#CDC5B7] hover:border-[#1C3F30] bg-[#FFFFFF]'
                          }`}
                          aria-label={`Mark ${task.title} as ${isDone ? 'incomplete' : 'complete'}`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                aria-label={`Task title for ${task.title}`}
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full px-2 py-1 rounded border border-[#1C3F30] text-xs font-semibold"
                              />
                              <div className="flex flex-wrap gap-2 text-xs">
                                <input
                                  aria-label={`Due date for ${task.title}`}
                                  type="date"
                                  value={editDate}
                                  onChange={(e) => setEditDate(e.target.value)}
                                  className="px-2 py-1 rounded border border-[#E5DFD5] text-xs"
                                />
                                <select
                                  aria-label={`Priority for ${task.title}`}
                                  value={editPriority}
                                  onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                                  className="px-2 py-1 rounded border border-[#E5DFD5] text-xs"
                                >
                                  <option value="high">High</option>
                                  <option value="medium">Medium</option>
                                  <option value="low">Low</option>
                                </select>
                                <input
                                  aria-label={`Owner for ${task.title}`}
                                  type="text"
                                  placeholder="Owner"
                                  value={editOwner}
                                  onChange={(e) => setEditOwner(e.target.value)}
                                  className="px-2 py-1 rounded border border-[#E5DFD5] text-xs"
                                />
                                <button
                                  onClick={() => handleSaveEdit(task.id)}
                                  className="px-3 py-1 rounded bg-[#1C3F30] text-white font-medium text-xs shadow-xs"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h5
                                  className={`text-xs sm:text-sm font-semibold text-[#1E2922] ${
                                    isDone ? 'line-through text-[#8E9E96]' : ''
                                  }`}
                                >
                                  {task.title}
                                </h5>

                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                    task.priority === 'high'
                                      ? 'bg-[#FDF0ED] text-[#C0392B]'
                                      : task.priority === 'medium'
                                      ? 'bg-[#FEF6EB] text-[#B46B08]'
                                      : 'bg-[#F4EFEB] text-[#64746D]'
                                  }`}
                                >
                                  {task.priority}
                                </span>

                                <select
                                  value={task.status}
                                  onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                                  className="text-[11px] font-medium bg-[#F4EFEB] text-[#1E2922] border-0 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-[#1C3F30]"
                                >
                                  <option value="todo">To Do</option>
                                  <option value="in-progress">In Progress</option>
                                  <option value="done">Completed</option>
                                </select>
                              </div>

                              <p className="text-xs text-[#64746D] mt-1 leading-relaxed">
                                {task.description}
                              </p>

                              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-[#64746D]">
                                <span className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3 text-[#1C3F30]" />
                                  <span>Due: {task.dueDate}</span>
                                </span>
                                {task.owner && (
                                  <span className="flex items-center space-x-1">
                                    <User className="w-3 h-3 text-[#1C3F30]" />
                                    <span>{task.owner}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      {!isEditing && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleStartEdit(task)}
                            className="p-1 rounded text-[#64746D] hover:text-[#1C3F30] hover:bg-[#F4EFEB] transition-colors"
                            title="Edit task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 rounded text-[#64746D] hover:text-[#C0392B] hover:bg-[#FDF0ED] transition-colors"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
