import {
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";

@Entity("senior_contacts")
@Index("IDX_senior_contacts_senior_id", ["seniorId"])
export class SeniorContact {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  seniorId: string;

  @Column({ type: "varchar", length: 100 })
  fullName: string;

  @Column({ type: "varchar", length: 30 })
  phone: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
