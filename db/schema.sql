-- Database schema (MySQL 8 / MariaDB 11). All times are stored in UTC.

-- administrator account (password stored only as a bcrypt hash)
CREATE TABLE IF NOT EXISTS admins (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- login sessions; only the SHA-256 hash of the token is kept
CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) NOT NULL,
  admin_id INT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL,
  PRIMARY KEY (token_hash),
  KEY idx_sessions_admin (admin_id),
  CONSTRAINT fk_sessions_admin FOREIGN KEY (admin_id)
    REFERENCES admins (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- measurement series: allowed range and look on the chart
CREATE TABLE IF NOT EXISTS series (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  min_value DOUBLE NOT NULL,
  max_value DOUBLE NOT NULL,
  color CHAR(7) NOT NULL,
  icon VARCHAR(50) NULL,
  unit VARCHAR(20) NULL,
  PRIMARY KEY (id),
  CONSTRAINT chk_series_range CHECK (min_value < max_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- sensors; the API key is never stored, only its SHA-256 hash
-- deleting a series deletes its sensors
CREATE TABLE IF NOT EXISTS sensors (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  series_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  api_key_hash CHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_sensors_key (api_key_hash),
  KEY idx_sensors_series (series_id),
  CONSTRAINT fk_sensors_series FOREIGN KEY (series_id)
    REFERENCES series (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- measurements are removed only together with their series;
-- when a sensor is unregistered the results stay and sensor_id becomes NULL
CREATE TABLE IF NOT EXISTS measurements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  series_id INT UNSIGNED NOT NULL,
  sensor_id INT UNSIGNED NULL,
  val DOUBLE NOT NULL,
  measured_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_measurements_series_time (series_id, measured_at),
  KEY idx_measurements_time (measured_at),
  KEY idx_measurements_sensor (sensor_id),
  CONSTRAINT fk_measurements_series FOREIGN KEY (series_id)
    REFERENCES series (id) ON DELETE CASCADE,
  CONSTRAINT fk_measurements_sensor FOREIGN KEY (sensor_id)
    REFERENCES sensors (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
