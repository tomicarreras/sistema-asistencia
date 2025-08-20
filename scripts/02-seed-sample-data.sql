-- Adding sample data for testing

-- Insert sample teacher
INSERT INTO teachers (email, full_name, password_hash) VALUES 
('profesor@ejemplo.com', 'María González', '$2b$10$example_hash_here') 
ON CONFLICT (email) DO NOTHING;

-- Get the teacher ID for reference
DO $$
DECLARE
    teacher_uuid UUID;
    group_uuid UUID;
BEGIN
    -- Get teacher ID
    SELECT id INTO teacher_uuid FROM teachers WHERE email = 'profesor@ejemplo.com';
    
    -- Insert sample group
    INSERT INTO groups (name, description, place, schedule_date, schedule_time, teacher_id) 
    VALUES ('Matemáticas 1A', 'Curso de matemáticas básicas', 'Aula 101', '2025-01-15', '09:00', teacher_uuid)
    ON CONFLICT DO NOTHING
    RETURNING id INTO group_uuid;
    
    -- If group already exists, get its ID
    IF group_uuid IS NULL THEN
        SELECT id INTO group_uuid FROM groups WHERE name = 'Matemáticas 1A' AND teacher_id = teacher_uuid;
    END IF;
    
    -- Insert sample students
    INSERT INTO students (email, full_name, national_id, birth_date, group_id) VALUES 
    ('juan.perez@ejemplo.com', 'Juan Pérez', '12345678', '2005-03-15', group_uuid),
    ('maria.rodriguez@ejemplo.com', 'María Rodríguez', '87654321', '2005-07-22', group_uuid),
    ('carlos.lopez@ejemplo.com', 'Carlos López', '11223344', '2005-11-08', group_uuid)
    ON CONFLICT (email, group_id) DO NOTHING;
    
END $$;
