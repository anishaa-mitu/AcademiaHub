// Builder Pattern - step-by-step construction of a material listing
export interface MaterialDraft {
  title: string;
  description: string;
  type: 'pdf' | 'book' | 'project' | 'notes' | 'other';
  category: string;
  price: number;
  file_url: string;
  image_url: string;
  condition: 'new' | 'good' | 'fair' | 'poor';
  tags: string[];
}

export class MaterialBuilder {
  private draft: MaterialDraft = {
    title: '',
    description: '',
    type: 'notes',
    category: 'general',
    price: 0,
    file_url: '',
    image_url: '',
    condition: 'good',
    tags: [],
  };

  setTitle(title: string): this {
    this.draft.title = title;
    return this;
  }

  setDescription(description: string): this {
    this.draft.description = description;
    return this;
  }

  setType(type: MaterialDraft['type']): this {
    this.draft.type = type;
    return this;
  }

  setCategory(category: string): this {
    this.draft.category = category;
    return this;
  }

  setPrice(price: number): this {
    this.draft.price = price;
    return this;
  }

  setFileUrl(url: string): this {
    this.draft.file_url = url;
    return this;
  }

  setImageUrl(url: string): this {
    this.draft.image_url = url;
    return this;
  }

  setCondition(condition: MaterialDraft['condition']): this {
    this.draft.condition = condition;
    return this;
  }

  addTag(tag: string): this {
    if (!this.draft.tags.includes(tag)) {
      this.draft.tags.push(tag);
    }
    return this;
  }

  build(): MaterialDraft {
    if (!this.draft.title) throw new Error('Material title is required');
    if (this.draft.price < 0) throw new Error('Price cannot be negative');
    return { ...this.draft };
  }

  reset(): this {
    this.draft = {
      title: '',
      description: '',
      type: 'notes',
      category: 'general',
      price: 0,
      file_url: '',
      image_url: '',
      condition: 'good',
      tags: [],
    };
    return this;
  }
}
