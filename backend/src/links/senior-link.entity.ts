import { CreateDateColumn, Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

/** Rattachement d'un membre de la famille à un senior (relation plusieurs-à-plusieurs). */
@Entity('senior_links')
@Unique(['familyId', 'seniorId'])
export class SeniorLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  familyId: string;

  @Column('uuid')
  seniorId: string;

  @CreateDateColumn()
  createdAt: Date;
}
