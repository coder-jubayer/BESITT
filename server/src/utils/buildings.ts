import { Building } from '../models/Building';
import { IUserDocument } from '../models/User';

export async function buildingNameMap(buildingIds: Array<string | undefined>): Promise<Map<string, string>> {
  const ids = [...new Set(buildingIds.filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return new Map();

  const buildings = await Building.find({ _id: { $in: ids } });
  return new Map(buildings.map((b) => [b._id.toString(), b.name]));
}

export async function toUserDTO(user: IUserDocument) {
  const names = await buildingNameMap([user.buildingId]);
  return user.toSafeJSON(user.buildingId ? names.get(user.buildingId) : undefined);
}

export async function toUserDTOList(users: IUserDocument[]) {
  const names = await buildingNameMap(users.map((u) => u.buildingId));
  return users.map((u) => u.toSafeJSON(u.buildingId ? names.get(u.buildingId) : undefined));
}
