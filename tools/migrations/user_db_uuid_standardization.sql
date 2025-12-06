BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add new UUID primary key column
ALTER TABLE user_profiles ADD COLUMN id_uuid uuid DEFAULT uuid_generate_v4();
UPDATE user_profiles SET id_uuid = uuid_generate_v4() WHERE id_uuid IS NULL;

-- Swap primary key from integer to UUID
ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_pkey;
ALTER TABLE user_profiles RENAME COLUMN id TO id_legacy;
ALTER TABLE user_profiles RENAME COLUMN id_uuid TO id;
ALTER TABLE user_profiles ADD PRIMARY KEY (id);

-- NOTE: Update foreign keys in dependent tables to reference user_profiles(id)
-- Example:
-- ALTER TABLE some_table DROP CONSTRAINT some_table_user_id_fkey;
-- ALTER TABLE some_table ALTER COLUMN user_id TYPE uuid USING (uuid_generate_v4()); -- replace with proper mapping
-- ALTER TABLE some_table ADD CONSTRAINT some_table_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles(id);

COMMIT;


