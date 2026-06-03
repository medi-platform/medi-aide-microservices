-- Initialize Test Databases
-- Phase 7: Integration Testing

-- Create UUID extension in template
\c template1;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create test databases for each service
CREATE DATABASE agency_db_test;
CREATE DATABASE audit_db_test;
CREATE DATABASE auth_db_test;
CREATE DATABASE caregiver_db_test;
CREATE DATABASE careplan_db_test;
CREATE DATABASE carerequest_db_test;
CREATE DATABASE communication_db_test;
CREATE DATABASE contract_db_test;
CREATE DATABASE feedback_db_test;
CREATE DATABASE incident_db_test;
CREATE DATABASE mentorship_db_test;
CREATE DATABASE notification_db_test;
CREATE DATABASE patient_db_test;
CREATE DATABASE payment_db_test;
CREATE DATABASE reports_db_test;
CREATE DATABASE residential_db_test;
CREATE DATABASE scheduling_db_test;
CREATE DATABASE training_db_test;
CREATE DATABASE user_db_test;
CREATE DATABASE wellness_db_test;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE agency_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE audit_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE auth_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE caregiver_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE careplan_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE carerequest_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE communication_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE contract_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE feedback_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE incident_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE mentorship_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE notification_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE patient_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE payment_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE reports_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE residential_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE scheduling_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE training_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE user_db_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE wellness_db_test TO postgres;

-- Enable UUID extension in all test databases
\c agency_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c audit_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c auth_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c caregiver_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c careplan_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c carerequest_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c communication_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c contract_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c feedback_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c incident_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c mentorship_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c notification_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c patient_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c payment_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c reports_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c residential_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c scheduling_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c training_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c user_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c wellness_db_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
