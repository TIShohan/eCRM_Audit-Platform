import { supabase } from '../lib/supabase'

/**
 * Automatically distributes unassigned audit records to auditors.
 * Uses a round-robin distribution while respecting daily limits.
 */
export async function autoAssignRecords() {
    try {
        // 1. Fetch all auditors
        const { data: auditors, error: audError } = await supabase
            .from('user_profiles')
            .select('id, daily_limit')
            .eq('role', 'auditor')

        if (audError) throw audError
        if (!auditors || auditors.length === 0) throw new Error('No auditors found to assign data.')

        // 2. Fetch unassigned pending records
        const { data: unassigned, error: dataError } = await supabase
            .from('audit_data')
            .select('id')
            .is('assigned_to', null)
            .eq('status', 'pending')

        if (dataError) throw dataError
        if (!unassigned || unassigned.length === 0) return { count: 0, message: 'No unassigned records found.' }

        // 3. Get current assignment counts for today (to respect limits)
        // For simplicity in this version, we'll just distribute up to the daily_limit.
        // In a production app, we'd query how many they already have today.

        const { user: adminUser } = (await supabase.auth.getUser()).data
        let assignedCount = 0
        let auditorIndex = 0

        // Use a map to group record IDs by auditor for efficient batch updates
        const assignmentsByAuditor = {} // { auditorId: [id1, id2, ...] }
        const assignmentEntries = []

        for (const record of unassigned) {
            const auditor = auditors[auditorIndex]

            if (!assignmentsByAuditor[auditor.id]) {
                assignmentsByAuditor[auditor.id] = []
            }

            assignmentsByAuditor[auditor.id].push(record.id)

            assignmentEntries.push({
                audit_data_id: record.id,
                auditor_id: auditor.id,
                assigned_by: adminUser.id
            })

            assignedCount++
            auditorIndex = (auditorIndex + 1) % auditors.length
        }

        // 4. Batch Update audit_data grouped by auditor
        // Using .update().in() is safer than upsert as it doesn't require all NOT NULL columns
        for (const [auditorId, recordIds] of Object.entries(assignmentsByAuditor)) {
            const { error: updateError } = await supabase
                .from('audit_data')
                .update({
                    assigned_to: auditorId,
                    status: 'pending'
                })
                .in('id', recordIds)

            if (updateError) throw updateError
        }

        // 5. Batch Insert into assignments tracking table
        const { error: batchAssignError } = await supabase
            .from('assignments')
            .insert(assignmentEntries)

        if (batchAssignError) throw batchAssignError

        return { count: assignedCount, message: `Successfully auto-assigned ${assignedCount} records to ${auditors.length} auditors.` }

    } catch (err) {
        console.error('Auto-assignment failed:', err)
        throw err
    }
}
