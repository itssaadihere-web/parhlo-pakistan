const fs = require('fs');

let url = 'https://gkkmamgxdmrzhjalceti.supabase.co';
let key = 'sb_publishable_Vp-HCCvw8U_koxWc9kUcIQ_FCnXlOIB';

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) {
      if (k.trim() === 'NEXT_PUBLIC_SUPABASE_URL') url = v.trim();
      if (k.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') key = v.trim();
    }
  });
} catch (e) {}

const headers = {
  'apikey': key,
  'Authorization': `Bearer ${key}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

function formatPakistaniPhone(phoneStr) {
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

const STAGE_PRIORITY = {
  'converted': 6,
  'signed_in': 5,
  'demo_scheduled': 4,
  'interested': 3,
  'contacted': 2,
  'lost': 1,
  'new': 0
};

async function cleanDuplicates() {
  console.log('Fetching leads and lead_activities from Supabase...');
  const leadsRes = await fetch(`${url}/rest/v1/leads?select=*`, { headers });
  const leads = await leadsRes.json();

  const activitiesRes = await fetch(`${url}/rest/v1/lead_activities?select=*`, { headers });
  const activities = await activitiesRes.json();

  if (!Array.isArray(leads)) {
    console.error('Failed to load leads:', leads);
    return;
  }

  console.log(`Total leads loaded: ${leads.length}`);
  console.log(`Total activities loaded: ${Array.isArray(activities) ? activities.length : 0}`);

  const activityMap = {};
  (activities || []).forEach(act => {
    if (!activityMap[act.lead_id]) activityMap[act.lead_id] = [];
    activityMap[act.lead_id].push(act);
  });

  // Group leads by normalized phone or email
  const leadGroups = {};
  leads.forEach(lead => {
    const normPhone = formatPakistaniPhone(lead.phone);
    const normEmail = (lead.email || '').trim().toLowerCase();
    const groupKey = normPhone || normEmail || lead.id;

    if (!leadGroups[groupKey]) leadGroups[groupKey] = [];
    leadGroups[groupKey].push({
      ...lead,
      normPhone,
      activities: activityMap[lead.id] || []
    });
  });

  let deletedCount = 0;
  let mergedCount = 0;
  let cleanedGroups = 0;

  for (const [gKey, group] of Object.entries(leadGroups)) {
    if (group.length <= 1) continue;

    cleanedGroups++;
    console.log(`\nProcessing Duplicate Group ${cleanedGroups} (${gKey}) with ${group.length} leads:`);

    const contactedLeads = group.filter(l => l.activities.length > 0 || l.status !== 'new');
    const uncontactedLeads = group.filter(l => l.activities.length === 0 && l.status === 'new');

    let survivor = null;
    let leadsToDelete = [];

    if (contactedLeads.length > 1) {
      // Both/multiple contacted! Merge performance, assign to Faiz, delete redundant
      console.log(`  -> Multiple contacted leads found (${contactedLeads.length}). Merging performance & assigning to Faiz Ali...`);
      
      // Sort contacted leads by activity count / stage priority
      contactedLeads.sort((a, b) => {
        const pA = STAGE_PRIORITY[a.status] || 0;
        const pB = STAGE_PRIORITY[b.status] || 0;
        if (pA !== pB) return pB - pA;
        return b.activities.length - a.activities.length;
      });

      survivor = contactedLeads[0];
      const highestStatus = contactedLeads.reduce((best, cur) => {
        return (STAGE_PRIORITY[cur.status] || 0) > (STAGE_PRIORITY[best] || 0) ? cur.status : best;
      }, survivor.status);

      // Survivor updates
      const updatePayload = {
        assigned_to: 'faiz.ali@parhlopakistan.com.pk',
        status: highestStatus,
        updated_at: new Date().toISOString()
      };

      await fetch(`${url}/rest/v1/leads?id=eq.${survivor.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updatePayload)
      });

      // Move activities of other contacted leads to survivor
      for (let i = 1; i < contactedLeads.length; i++) {
        const other = contactedLeads[i];
        leadsToDelete.push(other);
        for (const act of other.activities) {
          await fetch(`${url}/rest/v1/lead_activities?id=eq.${act.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ lead_id: survivor.id })
          });
        }
      }

      // Also mark uncontacted leads for deletion
      leadsToDelete.push(...uncontactedLeads);
      mergedCount++;

    } else if (contactedLeads.length === 1) {
      // Exactly 1 contacted lead. Keep it, delete uncontacted duplicates
      survivor = contactedLeads[0];
      leadsToDelete.push(...uncontactedLeads);
      console.log(`  -> 1 contacted lead (${survivor.assigned_to || 'unassigned'}, status: ${survivor.status}). Deleting ${uncontactedLeads.length} uncontacted duplicate(s)...`);
    } else {
      // 0 contacted leads (all new). Keep first one, delete rest
      survivor = uncontactedLeads[0];
      leadsToDelete.push(...uncontactedLeads.slice(1));
      console.log(`  -> 0 contacted leads (all new). Keeping lead ${survivor.id}, deleting ${leadsToDelete.length} redundant duplicate(s)...`);
    }

    // Perform deletions
    for (const toDel of leadsToDelete) {
      console.log(`     Deleting lead ID: ${toDel.id} (Name: ${toDel.name}, Assigned: ${toDel.assigned_to})`);
      const delRes = await fetch(`${url}/rest/v1/leads?id=eq.${toDel.id}`, {
        method: 'DELETE',
        headers
      });
      if (delRes.ok) {
        deletedCount++;
      } else {
        console.error(`     Failed to delete lead ${toDel.id}:`, await delRes.text());
      }
    }
  }

  console.log(`\n==============================================`);
  console.log(`CLEANUP COMPLETE:`);
  console.log(`- Duplicate Groups Processed: ${cleanedGroups}`);
  console.log(`- Performance Merged Groups: ${mergedCount}`);
  console.log(`- Total Redundant Leads Deleted: ${deletedCount}`);
  console.log(`==============================================`);
}

cleanDuplicates();
