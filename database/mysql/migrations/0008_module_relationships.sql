ALTER TABLE timetables
  ADD COLUMN teacher_id VARCHAR(40),
  ADD CONSTRAINT fk_timetable_teacher FOREIGN KEY (school_id, teacher_id) REFERENCES teachers(school_id, id);

ALTER TABLE assignments
  ADD COLUMN teacher_id VARCHAR(40),
  ADD CONSTRAINT fk_assignment_record_teacher FOREIGN KEY (school_id, teacher_id) REFERENCES teachers(school_id, id);

ALTER TABLE book_loans
  ADD COLUMN book_id VARCHAR(40),
  ADD COLUMN student_id VARCHAR(40),
  ADD CONSTRAINT fk_book_loan_book FOREIGN KEY (school_id, book_id) REFERENCES books(school_id, id),
  ADD CONSTRAINT fk_book_loan_student FOREIGN KEY (school_id, student_id) REFERENCES students(school_id, id);

ALTER TABLE health_visits
  ADD COLUMN student_id VARCHAR(40),
  ADD CONSTRAINT fk_health_visit_student FOREIGN KEY (school_id, student_id) REFERENCES students(school_id, id);
