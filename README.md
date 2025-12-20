Postgre

ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;

dùng query update / add tay email cho hết user.

ALTER TABLE users ALTER COLUMN email SET NOT NULL;
