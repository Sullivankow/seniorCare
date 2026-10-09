import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum CheckInStatus {
  OK = 'OK', // « Je vais bien »
  NOT_GREAT = 'NOT_GREAT', // « Pas très en forme »
}

/** Un pointage du senior. */
@Entity('checkins')
export class CheckIn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  seniorId: string;

  @Column({ type: 'enum', enum: CheckInStatus, default: CheckInStatus.OK })
  status: CheckInStatus;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
