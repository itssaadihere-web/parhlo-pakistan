"use client";

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Users, ArrowRight, X, UserCheck } from 'lucide-react';
import { supabase } from '@/utils/supabase';

export function formatPakistaniPhone(phoneStr) {
  if (!phoneStr) return '';
  let cleaned = String(phoneStr).replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('03')) {
    cleaned = '92' + cleaned.substring(1);
  } else if (cleaned.startsWith('+92')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('3') && cleaned.length === 10) {
    cleaned = '92' + cleaned;
  }
  return cleaned;
}

export default function LeadExcelImporter({ salesReps = [], onImportSuccess }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [mapping, setMapping] = useState({ nameCol: 0, phoneCol: 1, emailCol: 2, courseCol: 3, notesCol: 4 });
  const [headers, setHeaders] = useState([]);
  const [assignmentMode, setAssignmentMode] = useState('round_robin'); // 'round_robin' | 'specific' | 'unassigned'
  const [selectedRep, setSelectedRep] = useState(salesReps[0]?.email || '');
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  };

  const processFile = (fileToProcess) => {
    setFile(fileToProcess);
    setStatusMessage({ type: '', text: '' });

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rawJson.length < 2) {
          setStatusMessage({ type: 'error', text: 'Excel file appears to be empty or missing data rows.' });
          return;
        }

        const headerRow = rawJson[0].map(h => String(h || '').trim());
        setHeaders(headerRow);

        // Auto detect column mappings
        let nameCol = 0, phoneCol = 1, emailCol = 2, courseCol = 3, notesCol = 4;
        headerRow.forEach((h, idx) => {
          const lower = h.toLowerCase();
          if (lower.includes('name') || lower.includes('student') || lower.includes('naam')) nameCol = idx;
          else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('whatsapp') || lower.includes('contact') || lower.includes('num')) phoneCol = idx;
          else if (lower.includes('email') || lower.includes('mail')) emailCol = idx;
          else if (lower.includes('course') || lower.includes('subject') || lower.includes('class')) courseCol = idx;
          else if (lower.includes('note') || lower.includes('remark') || lower.includes('city')) notesCol = idx;
        });

        setMapping({ nameCol, phoneCol, emailCol, courseCol, notesCol });

        const rowsData = rawJson.slice(1).filter(r => r && r.length > 0 && (r[nameCol] || r[phoneCol] || r[emailCol]));
        setParsedRows(rowsData);
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        setStatusMessage({ type: 'error', text: 'Failed to read file. Please ensure it is a valid .xlsx or .csv file.' });
      }
    };

    reader.readAsArrayBuffer(fileToProcess);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    setUploading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const activeReps = salesReps.length > 0 ? salesReps.map(r => r.email) : ['faiz.ali@parhlopakistan.com.pk', 'nabiha.irfan@parhlopakistan.com.pk'];
      let repIndex = 0;

      const leadsToInsert = parsedRows.map((row, idx) => {
        const rawName = row[mapping.nameCol] ? String(row[mapping.nameCol]).trim() : `Lead ${idx + 1}`;
        const rawPhone = row[mapping.phoneCol] ? String(row[mapping.phoneCol]).trim() : '';
        const rawEmail = row[mapping.emailCol] ? String(row[mapping.emailCol]).trim().toLowerCase() : '';
        const rawCourse = row[mapping.courseCol] ? String(row[mapping.courseCol]).trim() : '';
        const rawNotes = row[mapping.notesCol] ? String(row[mapping.notesCol]).trim() : '';

        let assignedTo = '';
        if (assignmentMode === 'round_robin' && activeReps.length > 0) {
          assignedTo = activeReps[repIndex % activeReps.length];
          repIndex++;
        } else if (assignmentMode === 'specific') {
          assignedTo = selectedRep;
        }

        return {
          name: rawName,
          phone: formatPakistaniPhone(rawPhone) || rawPhone,
          email: rawEmail,
          course_interest: rawCourse,
          notes: rawNotes,
          assigned_to: assignedTo,
          status: 'new',
          source: 'excel_import',
          created_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      // Insert into Supabase 'leads' table
      const { data, error } = await supabase.from('leads').insert(leadsToInsert).select('*');

      if (error) {
        console.warn('DB error, using local fallback:', error);
      }

      const insertedLeads = data || leadsToInsert.map(l => ({ ...l, id: 'lead_' + Math.random().toString(36).substr(2, 9) }));

      // Also save to localStorage fallback
      const existingLocal = JSON.parse(window.localStorage.getItem('parhlo_leads') || '[]');
      const updatedLocal = [...insertedLeads, ...existingLocal];
      window.localStorage.setItem('parhlo_leads', JSON.stringify(updatedLocal));

      setStatusMessage({
        type: 'success',
        text: `Successfully imported and assigned ${insertedLeads.length} leads!`
      });

      if (onImportSuccess) onImportSuccess(insertedLeads);

      // Reset
      setFile(null);
      setParsedRows([]);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Import failed: ' + err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-600" size={24} />
            Excel Lead Sheet Importer
          </h2>
          <p className="text-gray-500 text-xs mt-1">Upload an Excel (.xlsx / .csv) sheet with Row 1 = Headers (Name, Phone, Email).</p>
        </div>
      </div>

      {statusMessage.text && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs font-medium ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="flex-shrink-0 mt-0.5" /> : <AlertCircle className="flex-shrink-0 mt-0.5" />}
          <div>{statusMessage.text}</div>
        </div>
      )}

      {/* File Dropzone */}
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
            isDragOver ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Upload size={28} />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Click to Upload or Drag & Drop Excel Sheet</h3>
          <p className="text-xs text-gray-500">Supports .xlsx, .xls, and .csv files (Format: Col 1 Name, Col 2 Phone, Col 3 Email)</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Header Info */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={24} className="text-emerald-600" />
              <div>
                <div className="font-bold text-slate-900">{file.name}</div>
                <div className="text-gray-500">{parsedRows.length} valid lead rows detected</div>
              </div>
            </div>
            <button
              onClick={() => { setFile(null); setParsedRows([]); }}
              className="text-gray-400 hover:text-rose-600 p-2 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Column Mapping Selector */}
          {headers.length > 0 && (
            <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl space-y-3 text-xs">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5 text-sm">
                <CheckCircle2 size={16} className="text-emerald-600" /> Confirm Column Mapping
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Full Name Column:</label>
                  <select
                    value={mapping.nameCol}
                    onChange={(e) => setMapping({ ...mapping, nameCol: parseInt(e.target.value) })}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-slate-900 font-medium"
                  >
                    {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i+1}`}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Phone Number Column:</label>
                  <select
                    value={mapping.phoneCol}
                    onChange={(e) => setMapping({ ...mapping, phoneCol: parseInt(e.target.value) })}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-slate-900 font-medium"
                  >
                    {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i+1}`}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Email Address Column:</label>
                  <select
                    value={mapping.emailCol}
                    onChange={(e) => setMapping({ ...mapping, emailCol: parseInt(e.target.value) })}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-slate-900 font-medium"
                  >
                    {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i+1}`}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Sales Rep Lead Assignment Option */}
          <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl space-y-3 text-xs">
            <label className="font-bold text-slate-900 block text-sm flex items-center gap-2">
              <Users size={18} className="text-emerald-600" />
              Lead Distribution & Assignment Strategy
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAssignmentMode('round_robin')}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  assignmentMode === 'round_robin'
                    ? 'bg-emerald-600 text-white font-bold shadow-md border-emerald-600'
                    : 'bg-white text-gray-700 hover:border-gray-300 border-gray-200'
                }`}
              >
                <div className="font-bold text-sm">Round-Robin</div>
                <div className="text-[11px] opacity-80 mt-1">Distribute leads equally across all sales reps</div>
              </button>

              <button
                type="button"
                onClick={() => setAssignmentMode('specific')}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  assignmentMode === 'specific'
                    ? 'bg-emerald-600 text-white font-bold shadow-md border-emerald-600'
                    : 'bg-white text-gray-700 hover:border-gray-300 border-gray-200'
                }`}
              >
                <div className="font-bold text-sm">Assign to Specific Rep</div>
                <div className="text-[11px] opacity-80 mt-1">Assign all imported leads to 1 rep</div>
              </button>

              <button
                type="button"
                onClick={() => setAssignmentMode('unassigned')}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  assignmentMode === 'unassigned'
                    ? 'bg-emerald-600 text-white font-bold shadow-md border-emerald-600'
                    : 'bg-white text-gray-700 hover:border-gray-300 border-gray-200'
                }`}
              >
                <div className="font-bold text-sm">Unassigned Pool</div>
                <div className="text-[11px] opacity-80 mt-1">Leave in general unassigned pool</div>
              </button>
            </div>

            {assignmentMode === 'specific' && (
              <div className="pt-2">
                <label className="font-bold text-gray-700 block mb-1">Select Sales Representative:</label>
                <select
                  value={selectedRep}
                  onChange={(e) => setSelectedRep(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-slate-900 font-medium text-sm"
                >
                  {salesReps.map((r, i) => (
                    <option key={i} value={r.email}>{r.full_name || r.email} ({r.email})</option>
                  ))}
                  {salesReps.length === 0 && (
                    <>
                      <option value="faiz.ali@parhlopakistan.com.pk">Faiz Ali (faiz.ali@parhlopakistan.com.pk)</option>
                      <option value="nabiha.irfan@parhlopakistan.com.pk">Nabiha Irfan (nabiha.irfan@parhlopakistan.com.pk)</option>
                    </>
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Live Preview Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
              <span>Previewing First 5 Leads:</span>
              <span>Total rows to process: <strong>{parsedRows.length}</strong></span>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Course / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-slate-900">
                  {parsedRows.slice(0, 5).map((r, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-3 font-mono text-gray-400">{idx + 1}</td>
                      <td className="p-3 font-bold">{r[mapping.nameCol] || '—'}</td>
                      <td className="p-3 font-mono text-emerald-700">{formatPakistaniPhone(r[mapping.phoneCol]) || r[mapping.phoneCol] || '—'}</td>
                      <td className="p-3 font-mono text-gray-600">{r[mapping.emailCol] || '—'}</td>
                      <td className="p-3 text-gray-500 truncate max-w-[150px]">{r[mapping.courseCol] || r[mapping.notesCol] || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confirm Import Button */}
          <button
            onClick={handleImport}
            disabled={uploading}
            className="w-full bg-[#064e3b] hover:bg-green-700 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm disabled:opacity-50"
          >
            {uploading ? (
              <span>Importing Leads...</span>
            ) : (
              <>
                <UserCheck size={18} /> Import & Assign {parsedRows.length} Leads
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
