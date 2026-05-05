import { Material } from '../types';

// Decorator Pattern - adds computed properties to materials without modifying the core type
export interface EnrichedMaterial extends Material {
  priceLabel: string;
  conditionLabel: string;
  typeIcon: string;
  isNew: boolean;
  isFree: boolean;
}

export function enrichMaterial(material: Material): EnrichedMaterial {
  const priceLabel = material.price === 0 ? 'Free' : `$${material.price.toFixed(2)}`;

  const conditionLabels: Record<string, string> = {
    new: 'Brand New',
    good: 'Good Condition',
    fair: 'Fair Condition',
    poor: 'Poor Condition',
  };

  const typeIcons: Record<string, string> = {
    pdf: '📄',
    book: '📚',
    project: '💻',
    notes: '📝',
    other: '📦',
  };

  const createdAt = new Date(material.created_at);
  const isNew = Date.now() - createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;

  return {
    ...material,
    priceLabel,
    conditionLabel: conditionLabels[material.condition] ?? material.condition,
    typeIcon: typeIcons[material.type] ?? '📦',
    isNew,
    isFree: material.price === 0,
  };
}

export function enrichMaterials(materials: Material[]): EnrichedMaterial[] {
  return materials.map(enrichMaterial);
}
