import {
  Table,
  Column,
  Model,
  CreatedAt,
  UpdatedAt,
  DataType,
  AllowNull,
  PrimaryKey,
  AutoIncrement,
  ForeignKey
} from 'sequelize-typescript';

import Container from './containers.model';
import User from './users.model';

@Table
export default class Item extends Model<Item> {

  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  public id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  public description: string;

  @Column(DataType.STRING)
  public imageUrl: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  public quantity: number;

  @AllowNull(false)
  @Column(DataType.ARRAY(DataType.STRING))
  public tags: string[];

  @ForeignKey(() => Container)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  public containerId: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  public lastChangedBy: number;

  @CreatedAt
  @Column(DataType.DATE)
  public readonly createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  public readonly updatedAt: Date;

}
