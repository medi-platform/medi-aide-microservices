import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MentorProfile } from '../entities/mentor-profile.entity';
import { MentorshipRequirements } from '../entities/mentorship-request.entity';

export type MentorshipMatchResult = {
  mentorProfile: MentorProfile;
  score: number;
  scoreBreakdown: Record<string, number>;
  explanation: {
    summary: string;
    strengths: string[];
    concerns: string[];
    recommendedApproach?: string;
  };
};

@Injectable()
export class MentorshipMatchingService {
  constructor(
    @InjectRepository(MentorProfile)
    private readonly mentorRepo: Repository<MentorProfile>,
  ) {}

  async generateMatches(
    menteeId: string,
    requirements: MentorshipRequirements = {},
    limit = 10,
  ): Promise<MentorshipMatchResult[]> {
    // Fetch candidate mentors
    const mentors = await this.mentorRepo.find({
      where: { isActive: true },
      order: { ratingAvg: 'DESC', ratingCount: 'DESC', updatedAt: 'DESC' },
      take: 500,
    });

    const scored = mentors
      .filter(m => m.userId !== menteeId)
      .map(m => this.scoreMentor(m, requirements))
      .sort((a, b) => b.score - a.score || a.mentorProfile.id.localeCompare(b.mentorProfile.id))
      .slice(0, Math.min(Math.max(limit, 1), 50));

    return scored;
  }

  private scoreMentor(mentor: MentorProfile, req: MentorshipRequirements): MentorshipMatchResult {
    const weights = {
      specialization: 0.35,
      skills: 0.20,
      experience: 0.15,
      language: 0.15,
      availability: 0.15,
    };

    const specializationScore = this.overlapScore(req.specializations, mentor.specializations);
    const skillsScore = this.overlapScore(req.goals, mentor.skills); // goals are treated as desired skills/topics
    const languageScore = this.overlapScore(req.languagePreference, mentor.languages);

    const menteeYears = typeof req.menteeYearsExperience === 'number' ? req.menteeYearsExperience : undefined;
    const experienceScore = this.experienceScore(menteeYears, mentor.yearsExperience);

    const availabilityScore = this.availabilityScore(req.availabilityHoursPerWeek, mentor.availabilityHoursPerWeek);

    const score =
      specializationScore * weights.specialization +
      skillsScore * weights.skills +
      experienceScore * weights.experience +
      languageScore * weights.language +
      availabilityScore * weights.availability;

    const roundedScore = Math.round(score * 1000) / 1000;

    const strengths: string[] = [];
    const concerns: string[] = [];

    if (specializationScore >= 0.8) strengths.push('Strong specialization alignment');
    if (experienceScore >= 0.75) strengths.push('Experience level is a great fit');
    if (languageScore >= 0.6) strengths.push('Language preference match');
    if (availabilityScore >= 0.8) strengths.push('Availability meets your needs');

    if (specializationScore < 0.4 && (req.specializations?.length || 0) > 0) concerns.push('Limited specialization overlap');
    if (availabilityScore < 0.5 && req.availabilityHoursPerWeek) concerns.push('Availability may be limited');
    if (languageScore < 0.5 && (req.languagePreference?.length || 0) > 0) concerns.push('Language match may be limited');

    const summary = `Mentor match score ${Math.round(roundedScore * 100)}% based on specializations, skills, experience, language, and availability.`;

    return {
      mentorProfile: mentor,
      score: roundedScore,
      scoreBreakdown: {
        specialization: specializationScore,
        skills: skillsScore,
        experience: experienceScore,
        language: languageScore,
        availability: availabilityScore,
      },
      explanation: {
        summary,
        strengths,
        concerns,
        recommendedApproach:
          roundedScore >= 0.75
            ? 'Start with a goals alignment call, then establish a weekly cadence.'
            : 'Start with a short intro call to confirm fit before committing to a cadence.',
      },
    };
  }

  private overlapScore(a?: string[], b?: string[]): number {
    const left = (a || []).map(s => String(s).toLowerCase()).filter(Boolean);
    const right = new Set((b || []).map(s => String(s).toLowerCase()).filter(Boolean));
    if (left.length === 0 || right.size === 0) return 0.5; // neutral when missing data
    const matches = left.filter(x => right.has(x)).length;
    return Math.min(1, matches / Math.max(left.length, 1));
  }

  private experienceScore(menteeYears: number | undefined, mentorYears: number): number {
    if (menteeYears === undefined) return 0.6; // neutral
    const gap = mentorYears - menteeYears;
    if (gap <= 0) return 0.3;
    if (gap >= 10) return 1;
    return Math.min(1, 0.4 + gap / 10 * 0.6);
  }

  private availabilityScore(requiredHours: number | undefined, mentorHours: number): number {
    if (!requiredHours || requiredHours <= 0) return 0.6; // neutral
    if (mentorHours >= requiredHours) return 1;
    return Math.max(0, mentorHours / requiredHours);
  }
}


