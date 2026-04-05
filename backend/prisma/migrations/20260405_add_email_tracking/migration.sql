-- Add email tracking columns to users table
ALTER TABLE "users" ADD COLUMN "email_sent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "email_sent_at" TIMESTAMP(3);
