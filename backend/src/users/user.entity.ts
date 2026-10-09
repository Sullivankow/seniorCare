import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../common/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: Role })
  role: Role;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  /** Hash bcrypt. `select: false` : jamais renvoyé par défaut dans les requêtes. */
  @Column({ select: false })
  passwordHash: string;

  /**
   * Code d'invitation (seniors uniquement). Le senior le donne à sa famille,
   * qui le saisit dans son app pour se rattacher à lui.
   */
  @Column({ type: 'varchar', unique: true, nullable: true })
  inviteCode: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
