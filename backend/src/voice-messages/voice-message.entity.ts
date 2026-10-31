import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";

@Entity("voice_messages")
@Index("IDX_voice_messages_senior_created_at", ["seniorId", "createdAt"])
export class VoiceMessage {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  seniorId: string;

  @Column({ type: "varchar", length: 255, unique: true })
  storageKey: string;

  @Column({ type: "varchar", length: 50 })
  mimeType: string;

  @Column("int")
  durationSeconds: number;

  @Column("int")
  fileSizeBytes: number;

  @CreateDateColumn()
  createdAt: Date;
}
