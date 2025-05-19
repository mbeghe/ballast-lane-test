import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Index } from 'typeorm';
import { Indication } from './indication.entity';

@Entity()
@Index(['programId'], { unique: true })
export class Program {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  drug: string;

  @Column()
  programId: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Indication, (indication) => indication.program, {
    cascade: true,
  })
  indications: Indication[];
}
