import { Request } from 'express';
import { Building } from '../models/Building';
import { IUserDocument } from '../models/User';
import { publicFileUrl } from './uploads';

export async function buildingNameMap(buildingIds: Array<string | undefined>): Promise<Map<string, string>> {
  const ids = [...new Set(buildingIds.filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return new Map();

  const buildings = await Building.find({ _id: { $in: ids } });
  return new Map(buildings.map((b) => [b._id.toString(), b.name]));
}

export async function toUserDTO(user: IUserDocument, req?: Request) {
  const names = await buildingNameMap([user.buildingId]);
  const json = user.toSafeJSON(user.buildingId ? names.get(user.buildingId) : undefined);
  return {
    ...json,
    avatar: req ? publicFileUrl(req, user.avatar) : user.avatar,
  };
}

export async function toUserDTOList(users: IUserDocument[], req?: Request) {
  const names = await buildingNameMap(users.map((u) => u.buildingId));
  return users.map((u) => {
    const json = u.toSafeJSON(u.buildingId ? names.get(u.buildingId) : undefined);
    return {
      ...json,
      avatar: req ? publicFileUrl(req, u.avatar) : u.avatar,
    };
  });
}
