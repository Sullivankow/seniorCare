import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";

@Entity("family_photos")
@Index("IDX_family_photos_senior_created_at", ["seniorId", "createdAt"])
@Index("IDX_family_photos_senior_surprise_date", ["seniorId", "surpriseDate"])
export class FamilyPhoto {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  seniorId: string;

  @Column("uuid")
  uploadedByFamilyId: string;

  @Column({ type: "varchar", length: 120 })
  senderName: string;

  @Column({ type: "varchar", length: 255, unique: true })
  storageKey: string;

  @Column({ type: "varchar", length: 50 })
  mimeType: string;

  @Column("int")
  fileSizeBytes: number;

  @Column({ type: "varchar", length: 500, nullable: true })
  caption: string | null;

  @Column({ type: "date", nullable: true })
  memoryDate: string | null;

  @Column({ type: "date", nullable: true })
  surpriseDate: string | null;

  @Column({ type: "timestamptz", nullable: true })
  likedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
