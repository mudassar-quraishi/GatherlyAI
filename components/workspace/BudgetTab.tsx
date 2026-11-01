'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { EventDetails, BudgetCategory } from '@/types/event';
import {
  formatCurrency,
  normalizeBudgetBreakdown,
  calculateBudgetHealth,
} from '@/lib/budget/calculator';

interface BudgetTabProps {
  event: EventDetails;
  onUpdateEvent: (updated: Partial<EventDetails>) => void;
}

export default function BudgetTab({ event, onUpdateEvent }: BudgetTabProps) {
  const plan = event.plan;
  const categories = plan?.budgetBreakdown.categories || [];
  const health = calculateBudgetHealth(event.totalBudget, categories);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAllocated, setEditAllocated] = useState<number>(0);
  const [editSpent, setEditSpent] = useState<number>(0);

  // New category form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatAllocated, setNewCatAllocated] = useState<number>(0);

  const handleStartEdit = (cat: BudgetCategory) => {
    setEditingId(cat.id);
    setEditAllocated(cat.allocatedAmount);
    setEditSpent(cat.actualSpent);
  };

  const handleSaveEdit = (catId: string) => {
    if (!plan) return;
    const updatedCats = categories.map((cat) => {
      if (cat.id === catId) {
        return {
          ...cat,
          allocatedAmount: Math.max(0, editAllocated),
          actualSpent: Math.max(0, editSpent),
        };
      }
      return cat;
    });

    const normalized = normalizeBudgetBreakdown(event.totalBudget, updatedCats);
    onUpdateEvent({
      plan: {
        ...plan,
        budgetBreakdown: normalized,
      },
    });
    setEditingId(null);
  };

  const handleDeleteCategory = (catId: string) => {
    if (!plan) return;
    const updatedCats = categories.filter((c) => c.id !== catId);
    const normalized = normalizeBudgetBreakdown(event.totalBudget, updatedCats);
    onUpdateEvent({
      plan: {
        ...plan,
        budgetBreakdown: normalized,
      },
    });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !newCatName.trim()) return;

    const newCategory: BudgetCategory = {
      id: `cat-custom-${Date.now()}`,
      name: newCatName.trim(),
      allocatedAmount: Math.max(0, newCatAllocated),
      actualSpent: 0,
      isEssential: false,
    };

    const updatedCats = [...categories, newCategory];
    const normalized = normalizeBudgetBreakdown(event.totalBudget, updatedCats);
    onUpdateEvent({
      plan: {
        ...plan,
        budgetBreakdown: normalized,
      },
    });

    setNewCatName('');
    setNewCatAllocated(0);
    setShowAddForm(false);
  };

  if (!plan) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-12 text-center">
        <DollarSign className="w-12 h-12 text-[#64746D] mx-auto mb-3" />
        <h3 className="text-lg font-bold text-[#1E2922]">No Budget Plan Available</h3>
        <p className="text-xs text-[#64746D] mt-1">
          Click &quot;Generate Plan with AI&quot; or &quot;Load Sample Plan&quot; to generate your event budget.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-xl p-5 shadow-sm">
          <span className="text-xs font-bold text-[#64746D] uppercase tracking-wider">
            Total Target Budget
          </span>
          <div className="text-2xl font-bold text-[#1E2922] mt-2">
            {formatCurrency(event.totalBudget, event.currency)}
          </div>
          <span className="text-[11px] text-[#64746D]">Event planned ceiling</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-xl p-5 shadow-sm">
          <span className="text-xs font-bold text-[#64746D] uppercase tracking-wider">
            Total Allocated
          </span>
          <div className="text-2xl font-bold text-[#1C3F30] mt-2">
            {formatCurrency(health.totalAllocated, event.currency)}
          </div>
          <span className="text-[11px] text-[#64746D]">
            {Math.round((health.totalAllocated / (event.totalBudget || 1)) * 100)}% of target
          </span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-xl p-5 shadow-sm">
          <span className="text-xs font-bold text-[#64746D] uppercase tracking-wider">
            Actual Spent
          </span>
          <div
            className={`text-2xl font-bold mt-2 ${
              health.isOverBudget ? 'text-[#C0392B]' : 'text-[#1E2922]'
            }`}
          >
            {formatCurrency(health.totalSpent, event.currency)}
          </div>
          <span className="text-[11px] text-[#64746D]">Entered payments</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-xl p-5 shadow-sm">
          <span className="text-xs font-bold text-[#64746D] uppercase tracking-wider">
            Remaining Budget
          </span>
          <div
            className={`text-2xl font-bold mt-2 ${
              health.remainingBudget < 0 ? 'text-[#C0392B]' : 'text-[#2E7D47]'
            }`}
          >
            {formatCurrency(health.remainingBudget, event.currency)}
          </div>
          <span className="text-[11px] text-[#64746D]">Unspent balance</span>
        </div>
      </div>

      {/* Health alerts & notifications */}
      {health.notes.length > 0 && (
        <div
          className={`p-4 rounded-xl border flex items-start space-x-3 ${
            health.isOverBudget
              ? 'bg-[#FDF0ED] border-[#F5C2B7] text-[#C0392B]'
              : health.isOverAllocated
              ? 'bg-[#FEF6EB] border-[#FCD34D] text-[#B46B08]'
              : 'bg-[#FEF6EB] border-[#FCD34D] text-[#B46B08]'
          }`}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <strong className="font-bold">Budget Status: </strong>
            {health.notes.join(' ')}
          </div>
        </div>
      )}

      {/* Visual Allocation Stack Bar */}
      <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-[#1E2922] uppercase tracking-wider">
            Category Allocation Distribution
          </h3>
          <span className="text-xs text-[#64746D]">
            Unallocated Buffer: {formatCurrency(plan.budgetBreakdown.unallocated, event.currency)}
          </span>
        </div>

        <div className="w-full h-4 rounded-full overflow-hidden flex bg-[#F4EFEB] shadow-inner mb-4">
          {categories.map((cat, idx) => {
            const pct = event.totalBudget > 0 ? (cat.allocatedAmount / event.totalBudget) * 100 : 0;
            const colors = [
              '#1C3F30',
              '#2E7D47',
              '#C85A32',
              '#B46B08',
              '#4A6B82',
              '#7D5BA6',
              '#3B7A57',
              '#9B6B43',
            ];
            const color = colors[idx % colors.length];

            return (
              <div
                key={cat.id}
                style={{ width: `${pct}%`, backgroundColor: color }}
                title={`${cat.name}: ${formatCurrency(cat.allocatedAmount, event.currency)} (${Math.round(pct)}%)`}
                className="h-full transition-all duration-300"
              />
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 text-[11px] text-[#64746D]">
          {categories.map((cat, idx) => {
            const colors = [
              '#1C3F30',
              '#2E7D47',
              '#C85A32',
              '#B46B08',
              '#4A6B82',
              '#7D5BA6',
              '#3B7A57',
              '#9B6B43',
            ];
            const color = colors[idx % colors.length];
            return (
              <div key={cat.id} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span>{cat.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-[#FFFFFF] border border-[#E5DFD5] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5DFD5] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1E2922]">Expense Categories</h3>
            <p className="text-xs text-[#64746D] mt-0.5">
              Click edit to adjust allocated budgets or record actual vendor invoices.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#1C3F30] hover:bg-[#153226] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Add Category Inline Modal/Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddCategory}
            className="p-4 bg-[#F4EFEB] border-b border-[#E5DFD5] flex flex-wrap items-center gap-3"
          >
            <label htmlFor="new-budget-category-name" className="sr-only">Budget category name</label>
            <input
              id="new-budget-category-name"
              type="text"
              placeholder="Category Name (e.g. Vintage Car Rental)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              required
              className="flex-1 min-w-[200px] px-3.5 py-2 rounded-lg border border-[#E5DFD5] bg-[#FFFFFF] text-xs"
            />
            <label htmlFor="new-budget-category-allocation" className="sr-only">Allocated budget amount</label>
            <input
              id="new-budget-category-allocation"
              type="number"
              placeholder="Allocated Budget"
              value={newCatAllocated || ''}
              onChange={(e) => setNewCatAllocated(parseFloat(e.target.value) || 0)}
              required
              className="w-40 px-3.5 py-2 rounded-lg border border-[#E5DFD5] bg-[#FFFFFF] text-xs"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#1C3F30] text-white text-xs font-semibold"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-2 rounded-lg text-xs font-medium text-[#64746D] hover:bg-[#E5DFD5]"
            >
              Cancel
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#FAF8F5] text-[#64746D] uppercase text-[11px] font-bold tracking-wider border-b border-[#E5DFD5]">
              <tr>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-4">Planned Allocation</th>
                <th className="py-3.5 px-4">Actual Spent</th>
                <th className="py-3.5 px-4">Variance</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EFEB]">
              {categories.map((cat) => {
                const isEditing = editingId === cat.id;
                const variance = cat.allocatedAmount - cat.actualSpent;

                return (
                  <tr key={cat.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-[#1E2922]">{cat.name}</div>
                      {cat.notes && (
                        <div className="text-[11px] text-[#64746D] line-clamp-1">{cat.notes}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <input
                          aria-label={`Planned allocation for ${cat.name}`}
                          type="number"
                          value={editAllocated}
                          onChange={(e) => setEditAllocated(parseFloat(e.target.value) || 0)}
                          className="w-28 px-2 py-1 rounded border border-[#1C3F30] bg-[#FFFFFF] text-xs font-semibold"
                        />
                      ) : (
                        <span className="font-semibold text-[#1E2922]">
                          {formatCurrency(cat.allocatedAmount, event.currency)}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <input
                          aria-label={`Actual spending for ${cat.name}`}
                          type="number"
                          value={editSpent}
                          onChange={(e) => setEditSpent(parseFloat(e.target.value) || 0)}
                          className="w-28 px-2 py-1 rounded border border-[#1C3F30] bg-[#FFFFFF] text-xs font-semibold"
                        />
                      ) : (
                        <span
                          className={`font-semibold ${
                            cat.actualSpent > cat.allocatedAmount
                              ? 'text-[#C0392B]'
                              : 'text-[#1E2922]'
                          }`}
                        >
                          {formatCurrency(cat.actualSpent, event.currency)}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-medium ${
                          variance < 0 ? 'text-[#C0392B]' : 'text-[#2E7D47]'
                        }`}
                      >
                        {variance < 0 ? `-${formatCurrency(Math.abs(variance), event.currency)}` : `+${formatCurrency(variance, event.currency)}`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isEditing ? (
                        <button
                          onClick={() => handleSaveEdit(cat.id)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-[#1C3F30] text-white text-xs font-medium shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      ) : (
                        <div className="inline-flex items-center space-x-2">
                          <button
                            onClick={() => handleStartEdit(cat)}
                            className="p-1 rounded text-[#64746D] hover:text-[#1C3F30] hover:bg-[#F4EFEB] transition-colors"
                            title="Edit category amount"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 rounded text-[#64746D] hover:text-[#C0392B] hover:bg-[#FDF0ED] transition-colors"
                            title="Delete category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Note on model estimates */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#E5DFD5] flex items-center space-x-2 text-[11px] text-[#64746D]">
          <Info className="w-4 h-4 text-[#8E9E96] flex-shrink-0" />
          <span>
            Initial category budgets are recommended baseline estimates for planning guidance. Always confirm final quotations directly with your vendors.
          </span>
        </div>
      </div>
    </div>
  );
}
