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
export default class Container extends Model<Container> {

  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  public id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  public description: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public location: string;

  @CreatedAt
  @Column(DataType.DATE)
  public readonly createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  public readonly updatedAt: Date;

}
