import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cars')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('decimal')
  price: number;

  // @Column({ default: 0 })
  // stock: number;
}
