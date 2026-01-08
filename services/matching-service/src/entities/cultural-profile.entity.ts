import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('cultural_profiles')
@Index(['userId'], { unique: true })
@Index(['primaryCulture'])
export class CulturalProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @Column({ name: 'user_type', type: 'varchar', length: 20 })
  userType!: 'caregiver' | 'patient';

  @Column({ name: 'primary_culture', nullable: true })
  primaryCulture?: string;

  @Column({ name: 'secondary_cultures', type: 'simple-array', nullable: true })
  secondaryCultures?: string[];

  @Column({ type: 'simple-array', nullable: true })
  languages?: string[];

  @Column({ name: 'preferred_language', nullable: true })
  preferredLanguage?: string;

  @Column({ name: 'religious_background', nullable: true })
  religiousBackground?: string;

  @Column({ name: 'dietary_restrictions', type: 'simple-array', nullable: true })
  dietaryRestrictions?: string[];

  @Column({ name: 'cultural_preferences', type: 'jsonb', nullable: true })
  culturalPreferences?: {
    genderPreference?: 'male' | 'female' | 'no_preference';
    ageRange?: { min: number; max: number };
    religiousCompatibility?: 'same_religion' | 'any' | 'secular';
    languageRequirement?: 'fluent' | 'basic' | 'any';
    culturalCustoms?: string[];
  };

  @Column({ name: 'communication_style', type: 'jsonb', nullable: true })
  communicationStyle?: {
    formal: boolean;
    directness: 'direct' | 'indirect' | 'balanced';
    eyeContact: 'important' | 'neutral' | 'avoid';
    physicalTouch: 'comfortable' | 'limited' | 'avoid';
  };

  @Column({ name: 'holiday_observances', type: 'simple-array', nullable: true })
  holidayObservances?: string[];

  @Column({ name: 'food_traditions', type: 'simple-array', nullable: true })
  foodTraditions?: string[];

  @Column({ name: 'cultural_importance', type: 'int', default: 5 })
  culturalImportance!: number; // 1-10 scale of how important cultural matching is

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

