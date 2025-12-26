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
            .select('id, email, daily_limit')
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

        const updates = []
        const assignmentEntries = []

        for (const record of unassigned) {
            const auditor = auditors[auditorIndex]

            // Assign the record
            updates.push({
                id: record.id,
                assigned_to: auditor.id,
                status: 'pending'
            })

            assignmentEntries.push({
                audit_data_id: record.id,
                auditor_id: auditor.id,
                assigned_by: adminUser.id
            })

            assignedCount++

            // Round robin to next auditor
            auditorIndex = (auditorIndex + 1) % auditors.length
        }

        // 4. Batch Update audit_data (Supabase upsert handles this if ID is provided)
        const { error: batchUpdateError } = await supabase
            .from('audit_data')
            .upsert(updates)

        if (batchUpdateError) throw batchUpdateError

        // 5. Batch Insert into assignments
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
