CREATE TABLE IF NOT EXISTS user_users (
  id          SERIAL UNIQUE,
  email       VARCHAR(255) NOT NULL,
  short_name  VARCHAR(255) NOT NULL,
  long_name   VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER OR REPLACE update_users_updated_at
BEFORE UPDATE ON customer
FOR EACH ROW EXECUTE PROCEDURE
update_updated_at_column();