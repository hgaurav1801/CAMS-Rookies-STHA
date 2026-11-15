-- CAMS-SDD-001 v1.0 : run this inside the database `cams`.
-- Supports MySQL 8.0+ (use mysql:8.4 in included compose file).
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('STUDENT','ADMIN','MANAGEMENT') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS student_profiles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL DEFAULT '',
  date_of_birth DATE NULL,
  phone VARCHAR(20) NOT NULL DEFAULT '',
  address VARCHAR(300) NOT NULL DEFAULT '',
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admission_cycles (
  id CHAR(36) PRIMARY KEY,
  display_name VARCHAR(30) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS courses (
  id CHAR(36) PRIMARY KEY,
  cycle_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  seat_capacity INT UNSIGNED NOT NULL,
  min_xii_percentage DECIMAL(5,2) NOT NULL,
  subject_policy ENUM('PHYSICS_MATH','MATH_OR_CS','NONE') NOT NULL DEFAULT 'NONE',
  CONSTRAINT fk_course_cycle FOREIGN KEY (cycle_id) REFERENCES admission_cycles(id),
  UNIQUE KEY unique_course_per_cycle (cycle_id,name),
  CONSTRAINT chk_min_percentage CHECK (min_xii_percentage BETWEEN 0 AND 100)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS applications (
  id CHAR(36) PRIMARY KEY,
  student_id CHAR(36) NOT NULL,
  cycle_id CHAR(36) NOT NULL,
  course_id CHAR(36) NOT NULL,
  class_x_percentage DECIMAL(5,2) NULL,
  class_xii_percentage DECIMAL(5,2) NULL,
  studied_physics BOOLEAN NOT NULL DEFAULT FALSE,
  studied_mathematics BOOLEAN NOT NULL DEFAULT FALSE,
  studied_computer_science BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('Draft','Submitted','Under Review','Correction Required','Approved','Rejected') NOT NULL DEFAULT 'Draft',
  submitted_at DATETIME NULL,
  decision_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_cycle (student_id,cycle_id),
  INDEX idx_course_status (course_id,status),
  CONSTRAINT fk_application_student FOREIGN KEY (student_id) REFERENCES student_profiles(id),
  CONSTRAINT fk_application_cycle FOREIGN KEY (cycle_id) REFERENCES admission_cycles(id),
  CONSTRAINT fk_application_course FOREIGN KEY (course_id) REFERENCES courses(id),
  CONSTRAINT chk_class_x CHECK (class_x_percentage IS NULL OR class_x_percentage BETWEEN 0 AND 100),
  CONSTRAINT chk_class_xii CHECK (class_xii_percentage IS NULL OR class_xii_percentage BETWEEN 0 AND 100)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS documents (
  id CHAR(36) PRIMARY KEY,
  application_id CHAR(36) NOT NULL,
  document_type ENUM('PHOTO','CLASS_X','CLASS_XII','IDENTITY') NOT NULL,
  storage_key VARCHAR(120) NOT NULL,
  mime_type VARCHAR(70) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  verification_state ENUM('PENDING','VERIFIED','NOT_VERIFIED') NOT NULL DEFAULT 'PENDING',
  verified_by CHAR(36) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_app_document_type (application_id,document_type),
  CONSTRAINT fk_document_application FOREIGN KEY (application_id) REFERENCES applications(id),
  CONSTRAINT fk_document_verifier FOREIGN KEY (verified_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS review_history (
  id CHAR(36) PRIMARY KEY,
  application_id CHAR(36) NOT NULL,
  actor_id CHAR(36) NOT NULL,
  old_status VARCHAR(30) NOT NULL,
  new_status VARCHAR(30) NOT NULL,
  reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_application FOREIGN KEY (application_id) REFERENCES applications(id),
  CONSTRAINT fk_history_actor FOREIGN KEY (actor_id) REFERENCES users(id),
  INDEX idx_review_time (application_id,created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS confirmations (
  id CHAR(36) PRIMARY KEY,
  application_id CHAR(36) NOT NULL UNIQUE,
  reference_code VARCHAR(90) NOT NULL UNIQUE,
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_confirmation_application FOREIGN KEY (application_id) REFERENCES applications(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  csrf_token VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_session_expiry (expires_at)
) ENGINE=InnoDB;
