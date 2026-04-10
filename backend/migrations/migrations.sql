ALTER TABLE direct_messages ADD COLUMN reply_to_id VARCHAR REFERENCES direct_messages(id);
ALTER TABLE channel_messages ADD COLUMN reply_to_id VARCHAR REFERENCES channel_messages(id);