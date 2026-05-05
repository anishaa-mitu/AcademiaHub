import { describe, it, expect } from 'vitest';
import {
  materialTitleSearch,
  materialCategorySearch,
  materialTagSearch,
  tutorTopicSearch,
} from '../patterns/SearchStrategy';
import { Material, TutorSession } from '../types';

const mockMaterials: Material[] = [
  {
    id: '1',
    seller_id: 'u1',
    title: 'Data Structures Notes',
    description: 'Covers arrays, linked lists, trees',
    type: 'notes',
    category: 'CSE',
    price: 100,
    file_url: '',
    image_url: '',
    status: 'approved',
    condition: 'good',
    tags: ['algorithms', 'data-structures'],
    view_count: 10,
    created_at: '',
    updated_at: '',
  },
  {
    id: '2',
    seller_id: 'u2',
    title: 'Calculus Textbook',
    description: 'Full calculus course material',
    type: 'book',
    category: 'Math',
    price: 200,
    file_url: '',
    image_url: '',
    status: 'approved',
    condition: 'new',
    tags: ['calculus', 'integration'],
    view_count: 5,
    created_at: '',
    updated_at: '',
  },
];

const mockTutorSessions: TutorSession[] = [
  {
    id: 't1',
    tutor_id: 'tu1',
    title: 'Python for Beginners',
    description: 'Learn Python from scratch',
    topics: ['Python', 'OOP', 'Data Science'],
    hourly_rate: 500,
    status: 'approved',
    availability: 'Weekends',
    created_at: '',
    updated_at: '',
  },
  {
    id: 't2',
    tutor_id: 'tu2',
    title: 'Advanced Math Tutoring',
    description: 'Calculus and linear algebra',
    topics: ['Calculus', 'Linear Algebra'],
    hourly_rate: 800,
    status: 'approved',
    availability: 'Evenings',
    created_at: '',
    updated_at: '',
  },
];

describe('SearchStrategy (Strategy Pattern)', () => {
  describe('materialTitleSearch', () => {
    it('returns all items when query is empty', () => {
      const result = materialTitleSearch.execute(mockMaterials, '');
      expect(result).toHaveLength(2);
    });

    it('filters by title keyword', () => {
      const result = materialTitleSearch.execute(mockMaterials, 'data structures');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('filters by description keyword', () => {
      const result = materialTitleSearch.execute(mockMaterials, 'arrays');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('is case insensitive', () => {
      const result = materialTitleSearch.execute(mockMaterials, 'CALCULUS');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('returns empty array when no match', () => {
      const result = materialTitleSearch.execute(mockMaterials, 'quantum physics');
      expect(result).toHaveLength(0);
    });
  });

  describe('materialCategorySearch', () => {
    it('filters materials by exact category', () => {
      const result = materialCategorySearch.execute(mockMaterials, 'CSE');
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('CSE');
    });

    it('returns empty if category does not exist', () => {
      const result = materialCategorySearch.execute(mockMaterials, 'Biology');
      expect(result).toHaveLength(0);
    });
  });

  describe('materialTagSearch', () => {
    it('filters materials by tag', () => {
      const result = materialTagSearch.execute(mockMaterials, 'algorithms');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('does partial tag matching', () => {
      const result = materialTagSearch.execute(mockMaterials, 'calc');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });
  });

  describe('tutorTopicSearch', () => {
    it('finds tutors by topic keyword', () => {
      const result = tutorTopicSearch.execute(mockTutorSessions, 'Python');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('t1');
    });

    it('finds tutors by title keyword', () => {
      const result = tutorTopicSearch.execute(mockTutorSessions, 'Advanced');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('t2');
    });

    it('returns all when query is empty', () => {
      const result = tutorTopicSearch.execute(mockTutorSessions, '');
      expect(result).toHaveLength(2);
    });
  });
});
