import { Material, TutorSession } from '../types';

// Strategy Pattern - interchangeable search/filter algorithms
interface SearchStrategy<T> {
  filter(items: T[], query: string): T[];
}

class MaterialTitleStrategy implements SearchStrategy<Material> {
  filter(items: Material[], query: string): Material[] {
    const q = query.toLowerCase();
    return items.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  }
}

class MaterialCategoryStrategy implements SearchStrategy<Material> {
  filter(items: Material[], query: string): Material[] {
    return items.filter(m => m.category.toLowerCase() === query.toLowerCase());
  }
}

class MaterialTagStrategy implements SearchStrategy<Material> {
  filter(items: Material[], query: string): Material[] {
    const q = query.toLowerCase();
    return items.filter(m =>
      m.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }
}

class TutorTopicStrategy implements SearchStrategy<TutorSession> {
  filter(items: TutorSession[], query: string): TutorSession[] {
    const q = query.toLowerCase();
    return items.filter(s =>
      s.topics.some(t => t.toLowerCase().includes(q)) ||
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  }
}

// Context that uses a strategy
export class SearchContext<T> {
  private strategy: SearchStrategy<T>;

  constructor(strategy: SearchStrategy<T>) {
    this.strategy = strategy;
  }

  setStrategy(strategy: SearchStrategy<T>): void {
    this.strategy = strategy;
  }

  execute(items: T[], query: string): T[] {
    if (!query.trim()) return items;
    return this.strategy.filter(items, query);
  }
}

export const materialTitleSearch = new SearchContext<Material>(new MaterialTitleStrategy());
export const materialCategorySearch = new SearchContext<Material>(new MaterialCategoryStrategy());
export const materialTagSearch = new SearchContext<Material>(new MaterialTagStrategy());
export const tutorTopicSearch = new SearchContext<TutorSession>(new TutorTopicStrategy());
