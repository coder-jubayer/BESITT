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

export function directoryTypeMeta(type: string) {
  return (
    DIRECTORY_TYPES.find((item) => item.value === type) ?? {
      value: 'welfare' as DirectoryType,
      label: 'Help Desk',
      icon: 'call',
    }
  );
}
