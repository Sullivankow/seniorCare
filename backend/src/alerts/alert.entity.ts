import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
}

/** Une alerte d'urgence (bouton SOS du senior). */
@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  seniorId: string;

  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.ACTIVE })
  status: AlertStatus;

  @Column({ type: 'varchar', nullable: true })
  message: string | null;

  // Position optionnelle (prévue pour une évolution : géolocalisation au moment du SOS)
  @Column({ type: 'double precision', nullable: true })
  latitude: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  /** Qui a clôturé l'alerte (le senior lui-même ou un proche). */
  @Column({ type: 'uuid', nullable: true })
  resolvedById: string | null;
}
