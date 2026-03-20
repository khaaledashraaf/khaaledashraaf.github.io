import { finds, type Find, type FindType } from "@/content/finds";

export function getAllFinds(): Find[] {
  return [...finds].sort(
    (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
  );
}

export function getFindsByType(type: FindType): Find[] {
  return getAllFinds().filter((f) => f.type === type);
}

export function getAllFindTypes(): FindType[] {
  const types = new Set(finds.map((f) => f.type));
  return Array.from(types).sort();
}
