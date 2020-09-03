import {
  Table,
  Column,
  Model,
  CreatedAt,
  UpdatedAt,
  DataType,
  AllowNull,
  PrimaryKey,
  AutoIncrement
} from 'sequelize-typescript';

@Table
export default class User extends Model<User> {

  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  public id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  public firstName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public lastName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public password: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public type: string;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  public active: boolean;

  @Column(DataType.JSON)
  public settings: any;

  @Column(DataType.JSON)
  public auth: any;

  @CreatedAt
  @Column(DataType.DATE)
  public readonly createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  public readonly updatedAt: Date;

}
