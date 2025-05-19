import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { Program } from './program.entity';
import { LabelSource } from 'src/common/types/label-source-type';

@Entity()
@Unique(['title', 'program'])
export class Indication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  icd10Code: string;

  @Column({ nullable: true })
  icd10Title: string;

  @Column()
  source: LabelSource;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Program, (program) => program.indications, {
    onDelete: 'CASCADE',
  })
  program: Program;
}
