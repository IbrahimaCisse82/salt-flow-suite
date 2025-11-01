import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  nameSchema,
  positiveNumberSchema,
  dateSchema,
  profileUpdateSchema,
  employeeSchema,
  bassinSchema,
  saleSchema,
  clientSchema,
  leaveRequestSchema,
  teamAttendanceSchema,
} from '../validation';

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should validate correct email', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(emailSchema.safeParse('invalid-email').success).toBe(false);
      expect(emailSchema.safeParse('').success).toBe(false);
    });

    it('should trim whitespace', () => {
      const result = emailSchema.parse('  test@example.com  ');
      expect(result).toBe('test@example.com');
    });
  });

  describe('passwordSchema', () => {
    it('should validate strong password', () => {
      expect(passwordSchema.safeParse('Str0ng!Pass').success).toBe(true);
    });

    it('should reject weak password', () => {
      expect(passwordSchema.safeParse('weak').success).toBe(false);
      expect(passwordSchema.safeParse('12345678').success).toBe(false);
      expect(passwordSchema.safeParse('onlylowercase').success).toBe(false);
    });

    it('should reject password without special char', () => {
      expect(passwordSchema.safeParse('Str0ngPass').success).toBe(false);
    });
  });

  describe('phoneSchema', () => {
    it('should validate French phone numbers', () => {
      expect(phoneSchema.safeParse('+33612345678').success).toBe(true);
      expect(phoneSchema.safeParse('0612345678').success).toBe(true);
    });

    it('should validate international phone numbers', () => {
      expect(phoneSchema.safeParse('+1234567890').success).toBe(true);
      expect(phoneSchema.safeParse('+221771234567').success).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(phoneSchema.safeParse('123').success).toBe(false);
      expect(phoneSchema.safeParse('abcdefghij').success).toBe(false);
    });
  });

  describe('nameSchema', () => {
    it('should validate correct names', () => {
      expect(nameSchema.safeParse('Jean Dupont').success).toBe(true);
      expect(nameSchema.safeParse("Marie-Claude O'Connor").success).toBe(true);
    });

    it('should reject names with numbers', () => {
      expect(nameSchema.safeParse('Jean123').success).toBe(false);
    });

    it('should reject XSS attempts', () => {
      expect(nameSchema.safeParse('<script>alert("xss")</script>').success).toBe(false);
    });

    it('should trim whitespace', () => {
      const result = nameSchema.parse('  Jean Dupont  ');
      expect(result).toBe('Jean Dupont');
    });
  });

  describe('positiveNumberSchema', () => {
    it('should validate positive numbers', () => {
      expect(positiveNumberSchema.safeParse(10).success).toBe(true);
      expect(positiveNumberSchema.safeParse(0.01).success).toBe(true);
    });

    it('should reject negative numbers and zero', () => {
      expect(positiveNumberSchema.safeParse(0).success).toBe(false);
      expect(positiveNumberSchema.safeParse(-5).success).toBe(false);
    });
  });

  describe('dateSchema', () => {
    it('should validate correct date', () => {
      const result = dateSchema.safeParse('2024-01-01');
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const result = dateSchema.safeParse('01-01-2024');
      expect(result.success).toBe(false);
    });
  });

  describe('employeeSchema', () => {
    it('should validate employee data', () => {
      const result = employeeSchema.safeParse({
        full_name: 'Jean Dupont',
        position: 'Manager',
        employee_type: 'permanent',
        phone: '+33612345678',
        email: 'jean@example.com',
        salary: 3000,
        hire_date: '2024-01-01',
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative salary', () => {
      const result = employeeSchema.safeParse({
        full_name: 'Jean Dupont',
        position: 'Manager',
        employee_type: 'permanent',
        salary: -1000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('bassinSchema', () => {
    it('should validate bassin data', () => {
      const result = bassinSchema.safeParse({
        name: 'Bassin A1',
        superficie: 1000,
        status: 'active',
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative superficie', () => {
      const result = bassinSchema.safeParse({
        name: 'Bassin A1',
        superficie: -100,
      });
      expect(result.success).toBe(false);
    });
  });


  describe('leaveRequestSchema', () => {
    it('should validate leave request with required fields', () => {
      const result = leaveRequestSchema.safeParse({
        employee_id: 'emp-123',
        start_date: '2024-01-10',
        end_date: '2024-01-15',
        leave_type: 'conge_annuel',
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional reason field', () => {
      const result = leaveRequestSchema.safeParse({
        employee_id: 'emp-123',
        start_date: '2024-01-10',
        end_date: '2024-01-15',
        leave_type: 'conge_maladie',
        reason: 'Medical appointment',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('teamAttendanceSchema', () => {
    it('should validate attendance data', () => {
      const result = teamAttendanceSchema.safeParse({
        team_id: 'team-123',
        attendance_date: '2024-01-15',
        workers_count: 10,
        daily_rate: 5000,
      });
      expect(result.success).toBe(true);
    });
  });
});
