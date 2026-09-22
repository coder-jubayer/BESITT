import { Request } from 'express';
import { Building, IBuildingDocument } from '../models/Building';
import { IUserDocument } from '../models/User';
import { getPlatformSettings } from '../models/PlatformSettings';
import { publicFileUrl } from './uploads';
import {
  BuildingAccessInfo,
  refreshBuildingAccess,
  toBuildingAccessInfo,
} from './buildingAccess';

interface BuildingSummary {
  name: string;
  code: string;
  doc?: IBuildingDocument;
}

export async function buildingSummaryMap(
  buildingIds: Array<string | undefined>,
): Promise<Map<string, BuildingSummary>> {
  const ids = [...new Set(buildingIds.filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return new Map();

  const buildings = await Building.find({ _id: { $in: ids } });
  const dirty: IBuildingDocument[] = [];
  for (const b of buildings) {
    if (refreshBuildingAccess(b)) dirty.push(b);
  }
  if (dirty.length) {
    await Promise.all(dirty.map((b) => b.save()));
  }

  return new Map(
    buildings.map((b) => [b._id.toString(), { name: b.name, code: b.code, doc: b }]),
  );
}

export async function toUserDTO(user: IUserDocument, req?: Request) {
  const buildings = await buildingSummaryMap([user.buildingId]);
  const building = user.buildingId ? buildings.get(user.buildingId) : undefined;
  const json = user.toSafeJSON(building?.name, building?.code);
  const platform = await getPlatformSettings();

  let buildingAccess: BuildingAccessInfo | undefined;
  if (building?.doc) {
    buildingAccess = toBuildingAccessInfo(building.doc);
  }

  return {
    ...json,
    avatar: req ? publicFileUrl(req, user.avatar) : user.avatar,
    buildingAccess,
    platform: platform.toSafeJSON(),
  };
}

export async function toUserDTOList(users: IUserDocument[], req?: Request) {
  const buildings = await buildingSummaryMap(users.map((u) => u.buildingId));
  return users.map((u) => {
    const building = u.buildingId ? buildings.get(u.buildingId) : undefined;
    const json = u.toSafeJSON(building?.name, building?.code);
    return {
      ...json,
      avatar: req ? publicFileUrl(req, u.avatar) : u.avatar,
      buildingAccess: building?.doc ? toBuildingAccessInfo(building.doc) : undefined,
    };
  });
}
