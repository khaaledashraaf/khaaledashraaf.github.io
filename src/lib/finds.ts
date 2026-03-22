import { finds, type Find, type FindType } from "@/content/finds";

export function getAllFinds(): Find[] {
  return [...finds].sort((a, b) => {
    const priorityDiff = (b.priority ?? 1) - (a.priority ?? 1);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
  });
}

export function getFindsByType(type: FindType): Find[] {
  return getAllFinds().filter((f) => f.type === type);
}

export function getAllFindTypes(): FindType[] {
  const types = new Set(finds.map((f) => f.type));
  return Array.from(types).sort();
}
