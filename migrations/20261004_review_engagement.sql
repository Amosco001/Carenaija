BEGIN;
ALTER TABLE email_preferences ADD COLUMN IF NOT EXISTS review_thank_you_email boolean NOT NULL DEFAULT true;
ALTER TABLE email_preferences ADD COLUMN IF NOT EXISTS review_thank_you_sms boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS review_thank_you_deliveries (
  id serial PRIMARY KEY,
  review_id integer NOT NULL,
  review_type text NOT NULL,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamp NOT NULL DEFAULT now(),
  sent_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS review_thank_you_delivery_unique ON review_thank_you_deliveries(review_id, review_type, channel);
CREATE INDEX IF NOT EXISTS review_thank_you_delivery_pending ON review_thank_you_deliveries(status, next_attempt_at);
COMMIT;