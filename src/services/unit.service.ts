import { getManager, getRepository, getConnection } from "typeorm";

import { Unit } from "../models/Unit.model";
import { User } from "../models/User.model";
import { Maintenance } from "../models/Maintenance.model";

import { UserService } from "../services/user.service";
import { UserUnit } from "../models/UserUnit.model";

interface ICreateUnitData {
  number: number;
  section: string;
  reference: number;
  owner?: string;
  maintenance?: Maintenance[];
  tenants?: string[];
}

interface IPatchedUnitData {
  number?: number;
  section?: string;
  owner?: string;
  reference?: number;
  maintenance?: Maintenance[];
  tenants?: string[];
}

export class UnitService {
  static async createUnit(data: ICreateUnitData): Promise<Unit> {
    const manager = getManager();
    const unit: Unit = new Unit();
    unit.number = data.number;
    unit.section = data.section;
    unit.reference = data.reference;

    const unitExists: Unit = await getRepository(Unit).findOne({
      where: {
        number: data.number,
        section: data.section,
        deleted: false
      }
    });

    if (unitExists) {
      throw new Error(`Unit ${data.number}${data.section} already exists`);
    }

    return manager.save(unit);
  }

  static getAll(): Promise<Unit[]> {
    return getRepository(Unit).find({
      where: {
        deleted: false
      }
    });
  }

  static getById(unitId: string): Promise<Unit> {
    return getRepository(Unit).findOne({
      where: {
        id: unitId,
        deleted: false
      },
      relations: ["userUnit", "userUnit.user"]
    });
  }

  static getByCode(code: string): Promise<Unit> {
    return getRepository(Unit).findOne({
      where: [
        {
          signUpCode: code,
          deleted: false
        },
        {
          ownerCode: code,
          deleted: false
        }
      ]
    });
  }

  static getByUser(userId: string): Promise<Unit[]> {
    return getRepository(Unit)
      .createQueryBuilder("unit")
      .innerJoinAndSelect("unit.userUnit", "userUnit")
      .innerJoinAndSelect("userUnit.user", "user", "user.id = :userId", {
        userId
      })
      .leftJoinAndSelect("unit.maintenance", "maintenance")
      .getMany();
  }

  static async patchUnit(id: string, data: IPatchedUnitData): Promise<Unit> {
    const manager = getManager();
    const repository = getRepository(Unit);
    const unit: Unit = await repository.findOne({
      where: {
        id,
        deleted: false
      }
    });
    unit.number = data.number || unit.number;
    unit.section = data.section || unit.section;
    unit.reference = data.reference || unit.reference;
    unit.updatedAt = new Date();

    if (!unit) {
      throw new Error(`Unit ${id} doesn't exists`);
    }

    if (
      (data.number && data.number !== unit.number) ||
      (data.section && data.section !== unit.section)
    ) {
      const unitExists: Unit = await getRepository(Unit).findOne({
        where: {
          number: unit.number,
          section: unit.section,
          deleted: false
        }
      });

      if (unitExists) {
        throw new Error(`Unit ${unit.number}${unit.section} already exists`);
      }
    }

    return manager.save(unit);
  }

  static async addUser(
    unitId: string,
    userId: string,
    isOwner: boolean
  ): Promise<Unit> {
    const manager = getManager();
    const unit = await UnitService.getById(unitId);

    if (!unit) {
      throw new Error(`Unit ${unitId} doesn't exists`);
    }

    const user = await UserService.getById(userId);

    if (!user) {
      throw new Error(`User ${userId} doesn't exists`);
    }

    const userUnit = new UserUnit();
    userUnit.unit = unit;
    userUnit.user = user;
    userUnit.isOwner = isOwner;

    await manager.save(userUnit);

    return manager.save(unit);
  }

  static async deleteUnit(id: string): Promise<Unit> {
    const repository = getRepository(Unit);
    const unit: Unit = await repository.findOne({
      where: {
        id,
        deleted: false
      }
    });
    if (unit) {
      unit.deleted = true;
      unit.deletedAt = new Date();
      return repository.save(unit);
    }
    return unit;
  }

  static async removeUser(userId: string, unitId: string): Promise<Unit> {
    const repository = getRepository(Unit);
    const unit = await UnitService.getById(unitId);

    return repository.save(unit);
  }

  static async changeUserPermission(
    userId: string,
    unitId: string,
    makeAdmin: boolean
  ): Promise<Unit> {
    const manager = getManager();
    const repository = getRepository(UserUnit);
    const userUnit = await repository.findOne({
      where: {
        userId,
        unitId
      }
    });

    userUnit.isOwner = makeAdmin;
    await manager.save(userUnit);
    return UnitService.getById(unitId);
  }
}
