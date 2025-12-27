import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CareRequest,
  CaregiverCandidate,
  CandidateFetchOptions,
  ICandidateFetcher,
} from '../interfaces/matching.interfaces';
import { CaregiverLocation } from '../entities/caregiver-location.entity';

/**
 * Candidate Fetcher Service
 * 
 * Fetches and enriches caregiver candidates for matching.
 * Supports both database queries and ID-based fetching for Redis Geo integration.
 */
@Injectable()
export class CandidateFetcherService implements ICandidateFetcher {
  private readonly logger = new Logger(CandidateFetcherService.name);
  
  // Backend API URL for fetching caregiver data
  private readonly BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://medi-aide-backend:3000';
  
  constructor(
    @InjectRepository(CaregiverLocation)
    private readonly locationRepo: Repository<CaregiverLocation>,
  ) {}
  
  /**
   * Get candidates for a care request
   */
  async getCandidates(
    careRequest: CareRequest,
    options: CandidateFetchOptions = {}
  ): Promise<CaregiverCandidate[]> {
    const {
      maxCandidates = 500,
      maxDistanceKm = 50,
      includeInactive = false,
      skillsRequired = true,
      relaxedMode = false,
    } = options;
    
    this.logger.debug(`Fetching candidates with options: ${JSON.stringify(options)}`);
    
    try {
      // Query for active caregiver locations within distance
      const queryBuilder = this.locationRepo
        .createQueryBuilder('location')
        .select('location.caregiverId', 'caregiverId')
        .addSelect('location.latitude', 'latitude')
        .addSelect('location.longitude', 'longitude')
        .addSelect('location.h3Index', 'h3Index')
        .addSelect('location.city', 'city')
        .addSelect('location.province', 'province')
        .addSelect('location.postalCode', 'postalCode')
        .addSelect('location.serviceRadiusKm', 'serviceRadiusKm');
      
      if (!includeInactive) {
        queryBuilder.where('location.isActive = :isActive', { isActive: true });
      }
      
      // Calculate distance if location available
      if (careRequest.location?.latitude && careRequest.location?.longitude) {
        // Use Haversine formula for distance calculation
        queryBuilder.addSelect(`
          (6371 * acos(
            cos(radians(:lat)) * cos(radians(location.latitude)) *
            cos(radians(location.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(location.latitude))
          ))
        `, 'distance')
        .setParameter('lat', careRequest.location.latitude)
        .setParameter('lng', careRequest.location.longitude)
        .having('distance <= :maxDistance', { maxDistance: maxDistanceKm })
        .orderBy('distance', 'ASC');
      }
      
      queryBuilder.limit(maxCandidates);
      
      const locations = await queryBuilder.getRawMany();
      
      this.logger.debug(`Found ${locations.length} caregiver locations`);
      
      // Enrich with full caregiver data from backend
      const caregiverIds = locations.map(l => l.caregiverId);
      if (caregiverIds.length === 0) {
        return [];
      }
      
      return this.enrichCandidates(caregiverIds, locations, careRequest, skillsRequired);
      
    } catch (error) {
      this.logger.error(`Failed to fetch candidates: ${error}`);
      throw error;
    }
  }
  
  /**
   * Get candidates by IDs (for Redis Geo integration)
   */
  async getCandidatesByIds(
    caregiverIds: string[],
    careRequest: CareRequest,
    options: { skillsRequired?: boolean } = {}
  ): Promise<CaregiverCandidate[]> {
    if (caregiverIds.length === 0) {
      return [];
    }
    
    // Fetch location data for these IDs
    const locations = await this.locationRepo
      .createQueryBuilder('location')
      .where('location.caregiverId IN (:...ids)', { ids: caregiverIds })
      .getMany();
    
    const locationMap = new Map(locations.map(l => [l.caregiverId, l]));
    const locationData = caregiverIds.map(id => {
      const loc = locationMap.get(id);
      return loc ? {
        caregiverId: id,
        latitude: loc.latitude,
        longitude: loc.longitude,
        h3Index: loc.h3Index,
        city: loc.city,
        province: loc.province,
        postalCode: loc.postalCode,
      } : null;
    }).filter(Boolean);
    
    return this.enrichCandidates(caregiverIds, locationData, careRequest, options.skillsRequired ?? true);
  }
  
  /**
   * Enrich candidates with full data from backend
   */
  private async enrichCandidates(
    caregiverIds: string[],
    locations: any[],
    careRequest: CareRequest,
    skillsRequired: boolean
  ): Promise<CaregiverCandidate[]> {
    try {
      // Fetch full caregiver data from backend API
      const response = await fetch(`${this.BACKEND_API_URL}/api/v1/caregivers/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: caregiverIds }),
      });
      
      if (!response.ok) {
        this.logger.warn(`Backend API returned ${response.status}, using minimal data`);
        return this.createMinimalCandidates(locations);
      }
      
      const caregiversData = await response.json();
      const caregiverMap = new Map<string, any>(caregiversData.map((c: any) => [c.id, c]));
      const locationMap = new Map<string, any>(locations.map((l: any) => [l.caregiverId, l]));
      
      const candidates: CaregiverCandidate[] = [];
      
      for (const id of caregiverIds) {
        const caregiver: any = caregiverMap.get(id);
        const location = locationMap.get(id);
        
        if (!caregiver) continue;
        
        // Filter by skills if required
        if (skillsRequired && careRequest.requiredSkills?.length) {
          const hasRequiredSkills = careRequest.requiredSkills.some(skill =>
            caregiver.skills?.some((s: string) => 
              s.toLowerCase().includes(skill.toLowerCase())
            )
          );
          if (!hasRequiredSkills) continue;
        }
        
        candidates.push(this.mapToCandidate(caregiver, location, careRequest));
      }
      
      return candidates;
      
    } catch (error) {
      this.logger.error(`Failed to enrich candidates: ${error}`);
      return this.createMinimalCandidates(locations);
    }
  }
  
  /**
   * Create minimal candidates when backend is unavailable
   */
  private createMinimalCandidates(locations: any[]): CaregiverCandidate[] {
    return locations.map(loc => ({
      id: loc.caregiverId,
      userId: loc.caregiverId,
      experienceYears: 1,
      skills: [],
      certifications: [],
      specializations: [],
      languages: ['English'],
      availability: {
        schedule: {},
        immediate: false,
        overnight: false,
        liveIn: false,
      },
      location: {
        latitude: loc.latitude,
        longitude: loc.longitude,
        city: loc.city || '',
        province: loc.province || '',
        postalCode: loc.postalCode || '',
        h3Index: loc.h3Index,
      },
      metrics: {
        rating: 4.0,
        completedCareRequests: 0,
        responseTimeMinutes: 60,
        acceptanceRate: 0.5,
        cancellationRate: 0,
        reliabilityScore: 0.7,
      },
      preferences: {
        maxDistanceKm: loc.serviceRadiusKm || 30,
        careTypes: [],
        patientConditions: [],
      },
      calculatedDistanceKm: loc.distance,
    }));
  }
  
  /**
   * Map caregiver data to candidate interface
   */
  private mapToCandidate(
    caregiver: any,
    location: any,
    careRequest: CareRequest
  ): CaregiverCandidate {
    // Calculate distance if location data available
    let calculatedDistanceKm: number | undefined;
    if (location?.distance) {
      calculatedDistanceKm = location.distance;
    } else if (location?.latitude && location?.longitude && 
               careRequest.location?.latitude && careRequest.location?.longitude) {
      calculatedDistanceKm = this.calculateDistance(
        careRequest.location.latitude,
        careRequest.location.longitude,
        location.latitude,
        location.longitude
      );
    }
    
    return {
      id: caregiver.id,
      userId: caregiver.userId || caregiver.user_id,
      experienceYears: caregiver.experienceYears || caregiver.experience_years || 0,
      skills: caregiver.skills || [],
      certifications: caregiver.certifications || [],
      specializations: caregiver.specializations || [],
      languages: caregiver.languages || ['English'],
      availability: {
        schedule: caregiver.availability?.schedule || caregiver.schedule || {},
        immediate: caregiver.availability?.immediate || false,
        overnight: caregiver.availability?.overnight || caregiver.overnight_availability || false,
        liveIn: caregiver.availability?.liveIn || caregiver.live_in_availability || false,
      },
      location: {
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
        city: location?.city || caregiver.city || '',
        province: location?.province || caregiver.province || '',
        postalCode: location?.postalCode || caregiver.postal_code || '',
        h3Index: location?.h3Index,
      },
      metrics: {
        rating: caregiver.rating || caregiver.average_rating || 4.0,
        completedCareRequests: caregiver.completed_care_requests || 0,
        responseTimeMinutes: caregiver.response_time_minutes || caregiver.avg_response_time || 60,
        acceptanceRate: caregiver.acceptance_rate || 0.5,
        cancellationRate: caregiver.cancellation_rate || 0,
        reliabilityScore: caregiver.reliability_score || 0.7,
      },
      preferences: {
        maxDistanceKm: caregiver.max_distance_km || caregiver.service_radius || 30,
        careTypes: caregiver.care_types || caregiver.preferred_care_types || [],
        patientConditions: caregiver.patient_conditions || [],
        hourlyRateMin: caregiver.hourly_rate_min,
        hourlyRateMax: caregiver.hourly_rate_max,
      },
      calculatedDistanceKm,
      hourlyRateMin: caregiver.hourly_rate_min,
      hourlyRateMax: caregiver.hourly_rate_max,
    };
  }
  
  /**
   * Calculate distance using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

















































