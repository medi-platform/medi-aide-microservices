-- =============================================================================
-- Database Index Optimization Script
-- Phase 8: Performance Optimization
--
-- These indexes are recommended for optimal query performance
-- Run during maintenance windows as index creation can lock tables
-- =============================================================================

-- ============================================================================
-- Agency Service Indexes
-- ============================================================================

-- Agency lookups by status and province
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_status ON agencies(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_province ON agencies(province);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_status_province ON agencies(status, province);

-- Job postings by agency and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_agency_status ON job_postings(agency_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at DESC);

-- Job applications by posting and applicant
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_posting ON job_applications(job_posting_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_applicant ON job_applications(applicant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_status ON job_applications(status);

-- Support tickets by agency and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_support_tickets_agency ON support_tickets(agency_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);

-- ============================================================================
-- Caregiver Service Indexes
-- ============================================================================

-- Caregiver lookups by agency and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_caregivers_agency ON caregivers(agency_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_caregivers_status ON caregivers(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_caregivers_agency_status ON caregivers(agency_id, status);

-- Caregiver availability
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_caregiver_availability_caregiver ON caregiver_availability(caregiver_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_caregiver_availability_date ON caregiver_availability(date);

-- Certifications by caregiver
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certifications_caregiver ON caregiver_certifications(caregiver_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certifications_expiry ON caregiver_certifications(expiry_date);

-- Skills lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_caregiver_skills_caregiver ON caregiver_skills(caregiver_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_caregiver_skills_skill_name ON caregiver_skills(skill_name);

-- ============================================================================
-- Residential Service Indexes
-- ============================================================================

-- Residence lookups by agency and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_residences_agency ON residences(agency_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_residences_status ON residences(status);

-- Room lookups by residence and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_residence ON rooms(residence_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_residence_status ON rooms(residence_id, status);

-- Resident lookups by residence
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_residents_residence ON residents(residence_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_residents_room ON residents(room_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_residents_status ON residents(status);

-- Shift lookups by residence and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_residential_shifts_residence ON residential_shifts(residence_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_residential_shifts_caregiver ON residential_shifts(caregiver_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_residential_shifts_date ON residential_shifts(start_time, end_time);

-- ============================================================================
-- Patient Service Indexes
-- ============================================================================

-- Patient lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_health_card ON patients(health_card_number);

-- Vital signs by patient and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vital_signs_patient ON vital_signs(patient_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vital_signs_recorded_at ON vital_signs(recorded_at DESC);

-- Medications by patient
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emar_records_patient ON emar_records(patient_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emar_records_scheduled ON emar_records(scheduled_time);

-- Clinical notes by patient and type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clinical_notes_patient ON clinical_notes(patient_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clinical_notes_type ON clinical_notes(note_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clinical_notes_created ON clinical_notes(created_at DESC);

-- ============================================================================
-- Scheduling Service Indexes
-- ============================================================================

-- Appointments by date range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_caregiver ON appointments(caregiver_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Shifts by date and caregiver
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shifts_date ON shifts(start_time, end_time);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shifts_caregiver ON shifts(caregiver_id);

-- ============================================================================
-- Communication Service Indexes
-- ============================================================================

-- Messages by conversation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- Notifications by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================================================
-- Audit/Security Indexes
-- ============================================================================

-- Audit logs by entity and timestamp
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Security events by type and timestamp
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_created ON security_events(created_at DESC);

-- ============================================================================
-- Full-Text Search Indexes (PostgreSQL)
-- ============================================================================

-- Patient name search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_fulltext 
ON patients USING gin(to_tsvector('english', first_name || ' ' || last_name));

-- Caregiver name search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_caregivers_fulltext 
ON caregivers USING gin(to_tsvector('english', first_name || ' ' || last_name));

-- Job posting search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_fulltext 
ON job_postings USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ============================================================================
-- Partial Indexes (PostgreSQL)
-- ============================================================================

-- Active entities only (reduces index size)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_active 
ON agencies(id) WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_caregivers_active 
ON caregivers(id) WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_active 
ON patients(id) WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_active 
ON job_postings(id) WHERE status = 'active';

-- Unread notifications only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread 
ON notifications(user_id) WHERE is_read = false;

-- ============================================================================
-- Composite Indexes for Common Queries
-- ============================================================================

-- Agency dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agency_dashboard 
ON caregivers(agency_id, status, created_at);

-- Scheduling dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schedule_dashboard 
ON appointments(caregiver_id, scheduled_date, status);

-- Patient care timeline
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_timeline 
ON clinical_notes(patient_id, created_at DESC);

-- ============================================================================
-- Index Maintenance Commands
-- ============================================================================

-- Reindex to rebuild fragmented indexes (run during maintenance)
-- REINDEX DATABASE medi_aide;

-- Analyze tables to update statistics
-- ANALYZE agencies;
-- ANALYZE caregivers;
-- ANALYZE patients;
-- ANALYZE appointments;

-- Check index usage
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;

-- Find unused indexes
-- SELECT schemaname, tablename, indexname, idx_scan
-- FROM pg_stat_user_indexes
-- WHERE idx_scan = 0
-- AND schemaname NOT IN ('pg_catalog', 'pg_toast');
