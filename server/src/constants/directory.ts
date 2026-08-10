export const DIRECTORY_TYPES = [
  { value: 'fire', label: 'Fire Service', icon: 'flame' },
  { value: 'police', label: 'Police Station', icon: 'shield' },
  { value: 'property_manager', label: 'Property Manager', icon: 'briefcase' },
  { value: 'security', label: 'Security Guard', icon: 'shield-checkmark' },
  { value: 'gas', label: 'Gas Supplier', icon: 'flame-outline' },
  { value: 'welfare', label: 'Welfare Society / Help Desk', icon: 'people' },
] as const;

export type DirectoryType = (typeof DIRECTORY_TYPES)[number]['value'];

export const DIRECTORY_TYPE_VALUES = DIRECTORY_TYPES.map((item) => item.value);

export type DirectoryTypeMeta = {
  value: string;
  label: string;
  icon: string;
  custom?: boolean;
};

export function slugifyDirectoryType(label: string): string {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || `custom_${Date.now()}`;
}

export function humanizeDirectoryType(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function directoryTypeMeta(type?: string | null, label?: string | null): DirectoryTypeMeta {
  if (!type) {
    return { value: 'other', label: label?.trim() || 'Other', icon: 'call' };
  }

  const preset = DIRECTORY_TYPES.find((item) => item.value === type);
  if (preset) {
    return { ...preset };
  }

  return {
    value: type,
    label: label?.trim() || humanizeDirectoryType(type),
    icon: 'call',
    custom: true,
  };
}

export function resolveDirectoryType(input: { type?: unknown; typeLabel?: unknown }): {
  type?: string;
  typeLabel?: string;
} {
  const rawType = String(input.type ?? '').trim();
  const rawLabel = String(input.typeLabel ?? '').trim();

  if (!rawType && !rawLabel) {
    return {};
  }

  if (rawType && DIRECTORY_TYPE_VALUES.includes(rawType as DirectoryType)) {
    const preset = directoryTypeMeta(rawType);
    return { type: preset.value, typeLabel: preset.label };
  }

  if (rawLabel) {
    const match = DIRECTORY_TYPES.find(
      (item) =>
        item.label.toLowerCase() === rawLabel.toLowerCase() || item.value === slugifyDirectoryType(rawLabel),
    );
    if (match) {
      return { type: match.value, typeLabel: match.label };
    }
    return { type: slugifyDirectoryType(rawLabel), typeLabel: rawLabel };
  }

  return { type: slugifyDirectoryType(rawType), typeLabel: humanizeDirectoryType(rawType) };
}

export function collectDirectoryTypes(
  contacts: Array<{ type?: string | null; typeLabel?: string | null }>,
): DirectoryTypeMeta[] {
  const seen = new Set<string>(DIRECTORY_TYPE_VALUES);
  const extras: DirectoryTypeMeta[] = [];

  for (const contact of contacts) {
    if (!contact.type || seen.has(contact.type)) continue;
    seen.add(contact.type);
    extras.push(directoryTypeMeta(contact.type, contact.typeLabel));
  }

  return [...DIRECTORY_TYPES.map((item) => ({ ...item })), ...extras];
}
