-- Insert a default user
INSERT INTO users (email) values ('michael.williamson@rcmp-grc.gc.ca');

-- Create two seizure reports attributed to that users user_id
INSERT INTO seizures (reference, location, reported_on, seized_on, user_id) VALUES ('#12345', '123 Main St.', '2025-09-18','2025-09-18', 1);
INSERT INTO seizures (reference, location, reported_on, seized_on, user_id) VALUES ('#12346', '123 Other St.', '2026-01-12','2026-01-12', 1);

-- Each seizure event potentially seized many substances. Make some and referencing the seizure ids.
INSERT INTO substances (name, category, amount, unit, seizure_id) VALUES ('fentanyl', 'controlled substance', 4.9, 'kilograms', 1);
INSERT INTO substances (name, category, amount, unit, seizure_id) VALUES ('cocaine', 'controlled substance', 157, 'grams', 1);
INSERT INTO substances (name, category, amount, unit, seizure_id) VALUES ('fentanyl', 'controlled substance', 11.9, 'kilograms', 2);
INSERT INTO substances (name, category, amount, unit, seizure_id) VALUES ('cocaine', 'controlled substance', 67, 'kilograms', 2);
INSERT INTO substances (name, category, amount, unit, seizure_id) VALUES ('cannabis', 'cannabis', 20, 'kilograms', 2);
