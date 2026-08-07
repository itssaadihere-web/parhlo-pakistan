"use client";

import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Clock,
  UserCheck,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  History,
  FileText,
  Tag,
  Gift,
  Trash2,
  Edit,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { formatPakistaniPhone } from './LeadExcelImporter';

const STAGES = [
  { id: 'new', label: 'New Lead', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'contacted', label: 'Contacted', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'interested', label: 'Interested', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'demo_scheduled', label: 'Demo / Trial', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'converted', label: 'Converted', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'lost', label: 'Lost / Unqualified', color: 'bg-rose-100 text-rose-800 border-rose-200' }
];

export default function LeadDetailModal({
  lead,
  currentUser,
  salesReps = [],
  onClose,
  onUpdateLead,
  onConvertToOffer
}) {
  const [currentLead, setCurrentLead] = useState(lead);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Form states for logging activity
  const [activityType, setActivityType] = useState('call'); // 'call' | 'whatsapp' | 'note' | 'status_change'
  const [callStatus, setCallStatus] = useState('connected'); // 'connected' | 'no_answer' | 'busy' | 'scheduled'
  const [activityNotes, setActivityNotes] = useState('');
  const [nextFollowup, setNextFollowup] = useState(lead.next_followup_at ? new Date(lead.next_followup_at).toISOString().slice(0, 16) : '');
  const [leadStatus, setLeadStatus] = useState(lead.status || 'new');
  const [assignedTo, setAssignedTo] = useState(lead.assigned_to || '');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    setCurrentLead(lead);
    setLeadStatus(lead.status || 'new');
    setAssignedTo(lead.assigned_to || '');
    setNextFollowup(lead.next_followup_at ? new Date(lead.next_followup_at).toISOString().slice(0, 16) : '');
    fetchActivities();
  }, [lead]);

  const fetchActivities = async () => {
    setLoadingActivities(true);
    let fetched = [];
    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        fetched = data;
      } else {
        const localLogs = JSON.parse(window.localStorage.getItem(`parhlo_lead_activities_${lead.id}`) || '[]');
        fetched = localLogs;
      }
    } catch (e) {
      const localLogs = JSON.parse(window.localStorage.getItem(`parhlo_lead_activities_${lead.id}`) || '[]');
      fetched = localLogs;
    }
    setActivities(fetched);
    setLoadingActivities(false);
  };

  const formattedPhone = formatPakistaniPhone(currentLead.phone);
  const whatsappUrl = formattedPhone 
    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(`Assalam o Alaikum ${currentLead.name}, Parhlo Pakistan team se rabta kar rahe hain. Standard 9th Class Sindh Board Online Coaching ke hawale se koi maloomat chahiye ho to bataiye.`)}`
    : '#';

  const handleWhatsAppClick = async () => {
    // Log WhatsApp activity automatically
    const newAct = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'act_' + Date.now(),
      lead_id: currentLead.id,
      sales_email: currentUser.email,
      activity_type: 'whatsapp',
      notes: 'Initiated direct WhatsApp conversation.',
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('lead_activities').insert([newAct]);
    } catch (e) {}

    const updated = [newAct, ...activities];
    setActivities(updated);
    window.localStorage.setItem(`parhlo_lead_activities_${currentLead.id}`, JSON.stringify(updated));

    window.open(whatsappUrl, '_blank');
  };

  const handleLogActivity = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg({ type: '', text: '' });

    const isStatusChanged = leadStatus !== currentLead.status;
    const isAssignedChanged = assignedTo !== currentLead.assigned_to;
    const followupIso = nextFollowup ? new Date(nextFollowup).toISOString() : null;

    // Build activity record
    const newAct = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'act_' + Date.now(),
      lead_id: currentLead.id,
      sales_email: currentUser.email,
      activity_type: activityType,
      call_status: activityType === 'call' ? callStatus : null,
      notes: activityNotes.trim() || (isStatusChanged ? `Status updated to ${leadStatus}` : 'Logged activity'),
      old_status: currentLead.status,
      new_status: leadStatus,
      created_at: new Date().toISOString()
    };

    // DB updates for Lead record
    const updatedLeadData = {
      status: leadStatus,
      assigned_to: assignedTo,
      next_followup_at: followupIso,
      updated_at: new Date().toISOString()
    };

    try {
      await supabase.from('lead_activities').insert([newAct]);
      await supabase.from('leads').update(updatedLeadData).eq('id', currentLead.id);
    } catch (err) {
      console.warn("DB update fallback:", err);
    }

    // Local Storage update fallback
    const localLeads = JSON.parse(window.localStorage.getItem('parhlo_leads') || '[]');
    const updatedLeads = localLeads.map(l => l.id === currentLead.id ? { ...l, ...updatedLeadData } : l);
    window.localStorage.setItem('parhlo_leads', JSON.stringify(updatedLeads));

    const updatedActivities = [newAct, ...activities];
    setActivities(updatedActivities);
    window.localStorage.setItem(`parhlo_lead_activities_${currentLead.id}`, JSON.stringify(updatedActivities));

    const refreshedLead = { ...currentLead, ...updatedLeadData };
    setCurrentLead(refreshedLead);
    if (onUpdateLead) onUpdateLead(refreshedLead);

    setFormMsg({ type: 'success', text: 'Activity and lead record successfully updated!' });
    setActivityNotes('');
    setSubmitting(false);
  };

  const currentStageObj = STAGES.find(s => s.id === currentLead.status) || STAGES[0];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl border border-gray-100 overflow-hidden relative max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 md:p-8 bg-slate-900 text-white flex justify-between items-start border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white">{currentLead.name}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${currentStageObj.color}`}>
                {currentStageObj.label}
              </span>
            </div>
            <p className="text-slate-400 text-xs font-mono">
              Phone: <strong className="text-emerald-400">{currentLead.phone}</strong> {currentLead.email ? `| Email: ${currentLead.email}` : ''}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          
          {/* Quick Action Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* WhatsApp Direct Action */}
            <button
              onClick={handleWhatsAppClick}
              disabled={!formattedPhone}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              <MessageSquare size={20} />
              Open Direct WhatsApp
            </button>

            {/* Direct Phone Call */}
            <a
              href={formattedPhone ? `tel:+${formattedPhone}` : '#'}
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm shadow-md transition-all text-center"
            >
              <Phone size={20} />
              Direct Phone Call
            </a>

            {/* Convert to Private Offer */}
            <button
              onClick={() => {
                onClose();
                if (onConvertToOffer) onConvertToOffer(currentLead);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm shadow-md transition-all"
            >
              <Gift size={20} />
              Issue Private Offer
            </button>

          </div>

          {/* Details Overview Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-gray-400 uppercase font-bold block text-[10px] mb-1">Assigned Sales Rep:</span>
              <span className="font-bold text-slate-900 text-sm block">{currentLead.assigned_to || 'Unassigned'}</span>
            </div>
            <div>
              <span className="text-gray-400 uppercase font-bold block text-[10px] mb-1">Course Interest:</span>
              <span className="font-bold text-slate-900 text-sm block">{currentLead.course_interest || 'Sindh Board Class 9'}</span>
            </div>
            <div>
              <span className="text-gray-400 uppercase font-bold block text-[10px] mb-1">Next Follow-up Due:</span>
              <span className="font-bold text-emerald-700 text-sm block font-mono">
                {currentLead.next_followup_at ? new Date(currentLead.next_followup_at).toLocaleString() : 'No follow-up set'}
              </span>
            </div>
          </div>

          {/* Form: Log New CRM Activity */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileText className="text-emerald-600" size={20} />
              Log Activity & Update Status
            </h3>

            {formMsg.text && (
              <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs font-medium ${
                formMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {formMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <div>{formMsg.text}</div>
              </div>
            )}

            <form onSubmit={handleLogActivity} className="space-y-4 text-xs">
              
              {/* Activity Type & Stage Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase tracking-wider">Activity Type:</label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-medium text-slate-900 text-xs"
                  >
                    <option value="call">Phone Call</option>
                    <option value="whatsapp">WhatsApp Message</option>
                    <option value="note">General Note</option>
                    <option value="status_change">Pipeline Stage Change Only</option>
                  </select>
                </div>

                {activityType === 'call' && (
                  <div>
                    <label className="font-bold text-gray-700 block mb-1 uppercase tracking-wider">Call Outcome:</label>
                    <select
                      value={callStatus}
                      onChange={(e) => setCallStatus(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-medium text-slate-900 text-xs"
                    >
                      <option value="connected">Call Connected / Talked</option>
                      <option value="no_answer">No Answer / Missed</option>
                      <option value="busy">Number Busy / Line Engaged</option>
                      <option value="scheduled">Call Scheduled for Later</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase tracking-wider">Pipeline Stage:</label>
                  <select
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-medium text-slate-900 text-xs"
                  >
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>

              </div>

              {/* Next Followup Date & Assigned Rep Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase tracking-wider">Set Next Follow-up Date & Time:</label>
                  <input
                    type="datetime-local"
                    value={nextFollowup}
                    onChange={(e) => setNextFollowup(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-medium text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase tracking-wider">Assigned Sales Representative:</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-medium text-slate-900 text-xs"
                  >
                    <option value="">Unassigned</option>
                    {salesReps.map((r, idx) => (
                      <option key={idx} value={r.email}>{r.full_name || r.email}</option>
                    ))}
                    {salesReps.length === 0 && (
                      <>
                        <option value="faiz.ali@parhlopakistan.com.pk">Faiz Ali</option>
                        <option value="nabiha.irfan@parhlopakistan.com.pk">Nabiha Irfan</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-gray-700 block mb-1 uppercase tracking-wider">Activity Notes / Call Summary:</label>
                <textarea
                  rows={3}
                  value={activityNotes}
                  onChange={(e) => setActivityNotes(e.target.value)}
                  placeholder="Enter details about what was discussed, student requirements, parent concerns, or next steps..."
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-medium text-slate-900 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#064e3b] hover:bg-green-700 text-white font-black py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
              >
                <Send size={16} /> Save Activity Log & Update Lead
              </button>

            </form>
          </div>

          {/* Activity Timeline Audit Trail */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <History className="text-emerald-600" size={20} />
              Activity History & Audit Trail ({activities.length})
            </h3>

            {loadingActivities ? (
              <p className="text-xs text-gray-400">Loading activity timeline...</p>
            ) : activities.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No activity recorded yet for this lead.</p>
            ) : (
              <div className="relative pl-6 border-l-2 border-emerald-100 space-y-6">
                {activities.map((act) => (
                  <div key={act.id} className="relative group">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-sm" />
                    <div className="bg-gray-50 border border-gray-200/80 p-4 rounded-2xl space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-gray-500">
                        <span className="font-bold text-slate-900 capitalize flex items-center gap-1.5">
                          {act.activity_type === 'call' && <Phone size={14} className="text-blue-600" />}
                          {act.activity_type === 'whatsapp' && <MessageSquare size={14} className="text-emerald-600" />}
                          {act.activity_type === 'note' && <FileText size={14} className="text-amber-600" />}
                          {act.activity_type} {act.call_status ? `(${act.call_status})` : ''}
                        </span>
                        <span className="font-mono text-[10px] text-gray-400">
                          {new Date(act.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium">{act.notes}</p>
                      <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-200/50 flex justify-between">
                        <span>Logged by: <strong className="text-slate-700">{act.sales_email}</strong></span>
                        {act.old_status && act.new_status && act.old_status !== act.new_status && (
                          <span className="text-emerald-700 font-bold">
                            Stage: {act.old_status} ➔ {act.new_status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
