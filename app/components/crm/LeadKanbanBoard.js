"use client";

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Phone,
  MessageSquare,
  Clock,
  User,
  Plus,
  MoreVertical,
  Calendar,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List
} from 'lucide-react';
import { formatPakistaniPhone } from './LeadExcelImporter';

const STAGES = [
  { id: 'new', label: 'New Lead', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'contacted', label: 'Contacted', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'interested', label: 'Interested', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'demo_scheduled', label: 'Demo / Trial', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'converted', label: 'Converted', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'lost', label: 'Lost / Unqualified', badge: 'bg-rose-100 text-rose-800 border-rose-200' }
];

export default function LeadKanbanBoard({
  leads = [],
  currentUser,
  salesReps = [],
  onSelectLead,
  onStageChange,
  onOpenImporter
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepFilter, setSelectedRepFilter] = useState(currentUser?.role === 'sales' ? 'my_leads' : 'all'); // 'all' | 'my_leads' | specific email
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [filterDueToday, setFilterDueToday] = useState(false);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const filteredLeads = leads.filter((l) => {
    // Search
    const matchesSearch =
      l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone?.includes(searchTerm) ||
      l.email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Rep filter
    if (selectedRepFilter === 'my_leads') {
      if (l.assigned_to?.toLowerCase() !== currentUser?.email?.toLowerCase()) return false;
    } else if (selectedRepFilter !== 'all') {
      if (l.assigned_to?.toLowerCase() !== selectedRepFilter.toLowerCase()) return false;
    }

    // Due today filter
    if (filterDueToday) {
      if (!l.next_followup_at) return false;
      const followupDay = new Date(l.next_followup_at).toISOString().slice(0, 10);
      if (followupDay !== todayStr) return false;
    }

    return true;
  });

  const dueTodayCount = leads.filter(l => {
    if (!l.next_followup_at) return false;
    return new Date(l.next_followup_at).toISOString().slice(0, 10) === todayStr;
  }).length;

  return (
    <div className="space-y-6">
      
      {/* Top Filter & Toolbar Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leads by name, phone, or email..."
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
          />
        </div>

        {/* Filters & View Switches */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Due Today Alert Button */}
          <button
            onClick={() => setFilterDueToday(!filterDueToday)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
              filterDueToday
                ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <Clock size={16} />
            Due Today ({dueTodayCount})
          </button>

          {/* Assigned Sales Rep Filter */}
          <select
            value={selectedRepFilter}
            onChange={(e) => setSelectedRepFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-medium"
          >
            <option value="all">All Sales Reps</option>
            <option value="my_leads">My Assigned Leads Only</option>
            {salesReps.map((r, i) => (
              <option key={i} value={r.email}>{r.full_name || r.email}</option>
            ))}
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500 hover:text-slate-900'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500 hover:text-slate-900'
              }`}
              title="Table List View"
            >
              <List size={18} />
            </button>
          </div>

          {/* Admin Import Lead Button */}
          {onOpenImporter && (
            <button
              onClick={onOpenImporter}
              className="bg-[#064e3b] hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Plus size={16} /> Import Excel Leads
            </button>
          )}

        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => (l.status || 'new') === stage.id);
            return (
              <div key={stage.id} className="bg-gray-50/80 border border-gray-200/80 rounded-3xl p-4 flex flex-col min-h-[500px]">
                
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${stage.badge}`}>
                      {stage.label}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded-lg border border-gray-200">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Stage Lead Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs font-medium border-2 border-dashed border-gray-200/60 rounded-2xl">
                      No leads
                    </div>
                  ) : (
                    stageLeads.map((lead, idx) => {
                      const formattedPhone = formatPakistaniPhone(lead.phone);
                      const isDueToday = lead.next_followup_at && new Date(lead.next_followup_at).toISOString().slice(0, 10) === todayStr;

                      return (
                        <div
                          key={lead.id || lead.phone || lead.email || `kanban_lead_${idx}`}
                          onClick={() => onSelectLead(lead)}
                          className={`bg-white border p-4 rounded-2xl space-y-3 cursor-pointer hover:shadow-md transition-all group relative ${
                            isDueToday ? 'border-rose-400 ring-2 ring-rose-100' : 'border-gray-200 hover:border-emerald-500'
                          }`}
                        >
                          {isDueToday && (
                            <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                              Due Today
                            </span>
                          )}

                          <div>
                            <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                              {lead.name}
                            </h4>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">{lead.phone}</p>
                            {lead.email && <p className="text-[11px] text-gray-400 truncate">{lead.email}</p>}
                          </div>

                          {lead.course_interest && (
                            <span className="inline-block bg-gray-100 text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-md">
                              {lead.course_interest}
                            </span>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-100">
                            <span className="truncate max-w-[100px]">{lead.assigned_to ? lead.assigned_to.split('@')[0] : 'Unassigned'}</span>
                            <div className="flex items-center gap-2">
                              {formattedPhone && (
                                <a
                                  href={`https://wa.me/${formattedPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-emerald-600 hover:text-emerald-800 p-1"
                                  title="WhatsApp Chat"
                                >
                                  <MessageSquare size={14} />
                                </a>
                              )}
                              <a
                                href={`tel:+${formattedPhone || lead.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Call Lead"
                              >
                                <Phone size={14} />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Email</th>
                <th className="p-4">Stage</th>
                <th className="p-4">Assigned Rep</th>
                <th className="p-4">Next Follow-up</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-slate-900 font-medium">
              {filteredLeads.map((lead, idx) => {
                const stageObj = STAGES.find(s => s.id === lead.status) || STAGES[0];
                const formattedPhone = formatPakistaniPhone(lead.phone);
                return (
                  <tr
                    key={lead.id || lead.phone || lead.email || `list_lead_${idx}`}
                    onClick={() => onSelectLead(lead)}
                    className="hover:bg-emerald-50/50 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-bold">{lead.name}</td>
                    <td className="p-4 font-mono text-emerald-700">{lead.phone}</td>
                    <td className="p-4 font-mono text-gray-500">{lead.email || '—'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${stageObj.badge}`}>
                        {stageObj.label}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{lead.assigned_to || 'Unassigned'}</td>
                    <td className="p-4 font-mono text-gray-500">
                      {lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {formattedPhone && (
                          <a
                            href={`https://wa.me/${formattedPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-50 text-emerald-700 p-2 rounded-xl border border-emerald-200 hover:bg-emerald-100"
                            title="WhatsApp"
                          >
                            <MessageSquare size={16} />
                          </a>
                        )}
                        <a
                          href={`tel:+${formattedPhone || lead.phone}`}
                          className="bg-blue-50 text-blue-700 p-2 rounded-xl border border-blue-200 hover:bg-blue-100"
                          title="Call"
                        >
                          <Phone size={16} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
