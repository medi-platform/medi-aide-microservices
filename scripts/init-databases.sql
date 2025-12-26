-- Stage Three Microservices Database Initialization
-- This script creates all databases required for the microservices architecture

-- Create service user
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_user') THEN
        CREATE USER service_user WITH PASSWORD 'service123';
    END IF;
END
$$;

-- Create all service databases
CREATE DATABASE IF NOT EXISTS auth_db;
CREATE DATABASE IF NOT EXISTS user_db;
CREATE DATABASE IF NOT EXISTS agency_db;
CREATE DATABASE IF NOT EXISTS caregiver_db;
CREATE DATABASE IF NOT EXISTS patient_db;
CREATE DATABASE IF NOT EXISTS care_request_db;
CREATE DATABASE IF NOT EXISTS care_plan_db;
CREATE DATABASE IF NOT EXISTS scheduling_db;
CREATE DATABASE IF NOT EXISTS visit_db;
CREATE DATABASE IF NOT EXISTS evv_db;
CREATE DATABASE IF NOT EXISTS notification_db;
CREATE DATABASE IF NOT EXISTS payment_db;
CREATE DATABASE IF NOT EXISTS billing_db;
CREATE DATABASE IF NOT EXISTS matching_db;
CREATE DATABASE IF NOT EXISTS wellness_db;
CREATE DATABASE IF NOT EXISTS analytics_db;
CREATE DATABASE IF NOT EXISTS audit_db;
CREATE DATABASE IF NOT EXISTS file_db;
CREATE DATABASE IF NOT EXISTS search_db;
CREATE DATABASE IF NOT EXISTS admin_db;
CREATE DATABASE IF NOT EXISTS integration_db;
CREATE DATABASE IF NOT EXISTS incident_db;
CREATE DATABASE IF NOT EXISTS insurance_db;
CREATE DATABASE IF NOT EXISTS training_db;
CREATE DATABASE IF NOT EXISTS feedback_db;
CREATE DATABASE IF NOT EXISTS contract_db;
CREATE DATABASE IF NOT EXISTS mentorship_db;
CREATE DATABASE IF NOT EXISTS moderation_db;
CREATE DATABASE IF NOT EXISTS communication_db;
CREATE DATABASE IF NOT EXISTS provincial_db;
CREATE DATABASE IF NOT EXISTS security_db;
CREATE DATABASE IF NOT EXISTS care_network_db;
CREATE DATABASE IF NOT EXISTS fraud_detection_db;
CREATE DATABASE IF NOT EXISTS admin_analytics_db;
CREATE DATABASE IF NOT EXISTS ai_db;

-- Grant permissions on each database
GRANT ALL PRIVILEGES ON DATABASE auth_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE user_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE agency_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE caregiver_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE patient_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE care_request_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE care_plan_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE scheduling_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE visit_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE evv_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE notification_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE payment_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE billing_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE matching_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE wellness_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE analytics_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE audit_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE file_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE search_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE admin_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE integration_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE incident_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE insurance_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE training_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE feedback_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE contract_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE mentorship_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE moderation_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE communication_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE provincial_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE security_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE care_network_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE fraud_detection_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE admin_analytics_db TO service_user;
GRANT ALL PRIVILEGES ON DATABASE ai_db TO service_user;

-- Grant schema permissions for each database
-- Note: Run these commands after connecting to each database

