-- Sprint 05 seed dataset for testing/demo
-- Default password for all seeded accounts: passer1234
-- BCrypt hash: $2a$10$Yn4Wfe9pxyqS5XJcSVfgaeXpuUQkz6koKalfBuRf.dm7hIM.R0ATu

-- ================================================================
-- SECTION 1: PERMANENT USERS (IDs 9001-9004, never removed)
-- These rows are inserted once and preserved across all restarts.
-- ================================================================

-- Permanent Admin 1: Mohamed Anis Bahri
INSERT INTO users (id, created_at, updated_at, phone_number, user_type, first_name, last_name, email, password_hash, role)
VALUES (9001, NOW(), NOW(), '99371713', 'ADMIN', 'Mohamed Anis', 'Bahri',
        'mohamedanisbahri52@gmail.com',
        '$2a$10$Yn4Wfe9pxyqS5XJcSVfgaeXpuUQkz6koKalfBuRf.dm7hIM.R0ATu', 'ROLE_ADMIN')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW();

INSERT INTO administrators (id, role_level, can_validate_budget)
VALUES (9001, 'SUPER', true)
ON CONFLICT (id) DO NOTHING;

-- Permanent Admin 2: Ahmed Rami Hassine
INSERT INTO users (id, created_at, updated_at, phone_number, user_type, first_name, last_name, email, password_hash, role)
VALUES (9002, NOW(), NOW(), '22222222', 'ADMIN', 'Ahmed Rami', 'Hassine',
        'ahmedramihassine2@gmail.com',
        '$2a$10$Yn4Wfe9pxyqS5XJcSVfgaeXpuUQkz6koKalfBuRf.dm7hIM.R0ATu', 'ROLE_ADMIN')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW();

INSERT INTO administrators (id, role_level, can_validate_budget)
VALUES (9002, 'SUPER', true)
ON CONFLICT (id) DO NOTHING;

-- Permanent Agent 1: agent1 (unique identifier 33333333333 stored as matricule)
INSERT INTO users (id, created_at, updated_at, phone_number, user_type, first_name, last_name, email, password_hash, role)
VALUES (9003, NOW(), NOW(), '99371713', 'AGENT', 'agent1', 'agent1',
        'agent1@municipalite.tn',
        '$2a$10$Yn4Wfe9pxyqS5XJcSVfgaeXpuUQkz6koKalfBuRf.dm7hIM.R0ATu', 'ROLE_AGENT')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW();

INSERT INTO municipal_agents (id, matricule, arrondissement, grade, service_type)
VALUES (9003, '33333333333', NULL, 'Cat_A', 'Voirie')
ON CONFLICT (id) DO NOTHING;

-- Permanent Agent 2: agent2 (unique identifier 44444444444 stored as matricule)
INSERT INTO users (id, created_at, updated_at, phone_number, user_type, first_name, last_name, email, password_hash, role)
VALUES (9004, NOW(), NOW(), '44444444', 'AGENT', 'agent2', 'agent2',
        'agent2@municipalite.tn',
        '$2a$10$Yn4Wfe9pxyqS5XJcSVfgaeXpuUQkz6koKalfBuRf.dm7hIM.R0ATu', 'ROLE_AGENT')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW();

INSERT INTO municipal_agents (id, matricule, arrondissement, grade, service_type)
VALUES (9004, '44444444444', NULL, 'Cat_A', 'Voirie')
ON CONFLICT (id) DO NOTHING;

-- Advance the identity sequence past permanent user IDs so new registrations
-- via the application do not collide with IDs 9001-9004.
SELECT setval('users_id_seq', GREATEST(9005, (SELECT COALESCE(MAX(id), 0) + 1 FROM users)));

-- ================================================================
-- SECTION 2: DEMO DATA (reset on each application restart)
-- Permanent users (9001-9004) are excluded from all DELETE statements.
-- ================================================================

DELETE FROM feedbacks;
DELETE FROM attachments;
DELETE FROM notifications;
DELETE FROM complaint_status_history;
DELETE FROM complaints;
DELETE FROM municipal_agents
 WHERE id IN (SELECT id FROM users
               WHERE email NOT IN ('agent1@municipalite.tn', 'agent2@municipalite.tn'));
DELETE FROM citizens;
DELETE FROM administrators
 WHERE id IN (SELECT id FROM users
               WHERE email NOT IN ('mohamedanisbahri52@gmail.com', 'ahmedramihassine2@gmail.com'));
DELETE FROM users
 WHERE email NOT IN ('mohamedanisbahri52@gmail.com', 'ahmedramihassine2@gmail.com',
                     'agent1@municipalite.tn', 'agent2@municipalite.tn');
DELETE FROM categories;

INSERT INTO users (id, created_at, updated_at, phone_number, user_type, first_name, last_name, email, password_hash, role) VALUES
(1, NOW(), NOW(), '20000001', 'ADMIN',   'Admin',   'Principal', 'admin.demo@municipalite.tn',   '$2a$10$Yn4Wfe9pxyqS5XJcSVfgaeXpuUQkz6koKalfBuRf.dm7hIM.R0ATu', 'ROLE_ADMIN'),
(2, NOW(), NOW(), '20000011', 'AGENT',   'Sami',    'Ben Amor',  'agent1.demo@municipalite.tn',  '$2a$10$Yn4Wfe9pxyqS5XJcSVfgaeXpuUQkz6koKalfBuRf.dm7hIM.R0ATu', 'ROLE_AGENT'),
(3, NOW(), NOW(), '20000012', 'AGENT',   'Leila',   'Mansouri',  'agent2.demo@municipalite.tn',  '$2a$10$Yn4Wfe9pxyqS5XJcSVfgaeXpuUQkz6koKalfBuRf.dm7hIM.R0ATu', 'ROLE_AGENT'),
(4, NOW(), NOW(), '20000021', 'CITIZEN', 'Aymen',   'Trabelsi',  'citizen1.demo@municipalite.tn','$2a$10$Yn4Wfe9pxyqS5XJcSVfgaeXpuUQkz6koKalfBuRf.dm7hIM.R0ATu', 'ROLE_CITIZEN'),
(5, NOW(), NOW(), '20000022', 'CITIZEN', 'Nour',    'Sassi',     'citizen2.demo@municipalite.tn','$2a$10$Yn4Wfe9pxyqS5XJcSVfgaeXpuUQkz6koKalfBuRf.dm7hIM.R0ATu', 'ROLE_CITIZEN'),
(6, NOW(), NOW(), '20000023', 'CITIZEN', 'Youssef', 'Cherif',    'citizen3.demo@municipalite.tn','$2a$10$Yn4Wfe9pxyqS5XJcSVfgaeXpuUQkz6koKalfBuRf.dm7hIM.R0ATu', 'ROLE_CITIZEN');

INSERT INTO administrators (id, role_level, can_validate_budget) VALUES
(1, 'SUPER', TRUE);

INSERT INTO municipal_agents (id, matricule, arrondissement, grade, service_type) VALUES
(2, 'AG-DEMO-001', 'Centre Ville', 'Cat_A', 'Voirie'),
(3, 'AG-DEMO-002', 'Bardo',        'Cat_B', 'Eclairage');

INSERT INTO citizens (id, num_cin, identifiant_unique, address, governorate, date_of_birth) VALUES
(4, '12345671', '12345678901', 'Tunis Centre',  'TUNIS',     DATE '1993-04-14'),
(5, '12345672', '12345678902', 'Ariana Ville',  'ARIANA',    DATE '1996-08-21'),
(6, '12345673', '12345678903', 'Ben Arous Sud', 'BEN_AROUS', DATE '1991-02-05');

INSERT INTO categories (id, label, sla_days, created_at) VALUES
(1, 'Voirie',           3, NOW()),
(2, 'Eclairage public', 2, NOW()),
(3, 'Assainissement',   4, NOW()),
(4, 'Espaces verts',    5, NOW());

INSERT INTO complaints (
  complaint_id, title, description, status, priority, latitude, longitude,
  category_id, citizen_id, assigned_agent_id, assigned_by_admin_id,
  target_date, created_at, updated_at, resolved_at, closed_at, archived_at, cancelled_at, rejected_at
) VALUES
('00000000-0000-0000-0000-000000000001', 'Nid-de-poule Avenue Habib Bourguiba', 'Nid-de-poule dangereux devant une ecole.', 'PENDING',     'High',      36.8065, 10.1815, 1, 4, NULL, NULL, CURRENT_DATE + 3, NOW() - INTERVAL '1 day', NOW(), NULL, NULL, NULL, NULL, NULL),
('00000000-0000-0000-0000-000000000002', 'Eclairage panne rue principale',       'Lampadaires eteints depuis 2 nuits.',       'IN_PROGRESS', 'Medium',    36.8189, 10.1658, 2, 5, 3, 1,    CURRENT_DATE + 1, NOW() - INTERVAL '2 days', NOW(), NULL, NULL, NULL, NULL, NULL),
('00000000-0000-0000-0000-000000000003', 'Egout bouche',                         'Eaux usees debordent sur la chaussee.',      'RESOLVED',    'High',      36.7920, 10.1674, 3, 6, 2, 1,    CURRENT_DATE - 1, NOW() - INTERVAL '5 days', NOW(), NOW() - INTERVAL '4 hours', NULL, NULL, NULL, NULL),
('00000000-0000-0000-0000-000000000004', 'Depot sauvage de dechets',              'Tas de dechets pres du marche municipal.',   'ARCHIVED',    'Medium',    36.8151, 10.1909, 1, 4, 2, 1,    CURRENT_DATE - 2, NOW() - INTERVAL '8 days', NOW(), NULL, NULL, NOW() - INTERVAL '1 day', NULL, NULL),
('00000000-0000-0000-0000-000000000005', 'Arbre risque de chute',                 'Arbre incline menace les pietons.',          'PENDING',     'Emergency', 36.8092, 10.1710, 4, 5, NULL, NULL, CURRENT_DATE + 5, NOW() - INTERVAL '3 hours', NOW(), NULL, NULL, NULL, NULL, NULL),
('00000000-0000-0000-0000-000000000006', 'Fuite d eau trottoir',                  'Fuite continue devant immeuble.',            'IN_PROGRESS', 'Low',       36.8037, 10.1840, 3, 6, 2, 1,    CURRENT_DATE + 2, NOW() - INTERVAL '1 day', NOW(), NULL, NULL, NULL, NULL, NULL),
('00000000-0000-0000-0000-000000000007', 'Signalisation deterioree',              'Panneau stop casse a un carrefour.',         'RESOLVED',    'Medium',    36.8201, 10.1538, 1, 4, 2, 1,    CURRENT_DATE - 1, NOW() - INTERVAL '6 days', NOW(), NOW() - INTERVAL '1 day', NULL, NULL, NULL, NULL),
('00000000-0000-0000-0000-000000000008', 'Caniveau obstrue',                      'Accumulation de boue apres pluie.',          'ARCHIVED',    'High',      36.7954, 10.1923, 3, 5, 3, 1,    CURRENT_DATE - 3, NOW() - INTERVAL '9 days', NOW(), NULL, NULL, NOW() - INTERVAL '2 days', NULL, NULL),
('00000000-0000-0000-0000-000000000009', 'Graffiti sur facade administrative',    'Facade municipale taguee.',                  'PENDING',     'Low',       36.8107, 10.1755, 4, 6, NULL, NULL, CURRENT_DATE + 5, NOW() - INTERVAL '10 hours', NOW(), NULL, NULL, NULL, NULL, NULL),
('00000000-0000-0000-0000-000000000010', 'Tranchee non securisee',                'Barriere absente autour des travaux.',       'IN_PROGRESS', 'Emergency', 36.8079, 10.1609, 1, 4, 2, 1,    CURRENT_DATE + 1, NOW() - INTERVAL '2 days', NOW(), NULL, NULL, NULL, NULL, NULL);
