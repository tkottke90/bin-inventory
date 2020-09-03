import {
  Table,
  Column,
  Model,
  CreatedAt,
  DataType,
  AllowNull,
  PrimaryKey,
  AutoIncrement,
  ForeignKey
} from 'sequelize-typescript';

import Item from './items.model';
import Container from './containers.model';
import User from './users.model';

@Table
export default class Transaction extends Model<Transaction> {

  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  public id: number;

  @ForeignKey(() => Item)  
  @AllowNull(false)
  @Column(DataType.INTEGER)
  public itemId: number;

  @ForeignKey(() => Container)  
  @AllowNull(false)
  @Column(DataType.INTEGER)
  public sourceId: number;

  @ForeignKey(() => Container) 
  @AllowNull(false)
  @Column(DataType.INTEGER)
  public destinationId: number;

  @ForeignKey(() => User) 
  @Column(DataType.STRING)
  public password: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public reason: string;

  @CreatedAt
  @Column(DataType.DATE)
  public readonly createdAt: Date;
}
