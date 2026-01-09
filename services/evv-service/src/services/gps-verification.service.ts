import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Geofence } from '../entities/geofence.entity';
import { GpsCoordinates, LocationValidation } from '../interfaces/evv.interface';

/**
 * GPS Verification Service
 * Handles geolocation validation and geofencing
 */
@Injectable()
export class GpsVerificationService {
  private readonly logger = new Logger(GpsVerificationService.name);
  private readonly maxDistanceMeters: number;
  private readonly accuracyThreshold: number;

  constructor(
    @InjectRepository(Geofence)
    private readonly geofenceRepo: Repository<Geofence>,
    private readonly configService: ConfigService,
  ) {
    this.maxDistanceMeters = this.configService.get<number>('gps.maxDistanceMeters', 200);
    this.accuracyThreshold = this.configService.get<number>('gps.accuracyThresholdMeters', 50);
  }

  /**
   * Validate GPS coordinates against patient geofence
   */
  async validateLocation(
    patientId: string,
    coordinates: GpsCoordinates,
  ): Promise<LocationValidation> {
    const geofence = await this.geofenceRepo.findOne({
      where: { patientId, isActive: true, isPrimary: true },
    });

    if (!geofence) {
      this.logger.warn(`No active geofence found for patient ${patientId}`);
      return {
        isValid: false,
        distanceMeters: -1,
        expectedAddress: 'Unknown',
        actualCoordinates: coordinates,
        accuracyMeters: coordinates.accuracy || 0,
        withinGeofence: false,
      };
    }

    const distance = this.calculateDistance(
      coordinates.latitude,
      coordinates.longitude,
      Number(geofence.centerLatitude),
      Number(geofence.centerLongitude),
    );

    const withinGeofence = distance <= Number(geofence.radiusMeters);
    const accuracyOk = !coordinates.accuracy || coordinates.accuracy <= this.accuracyThreshold;

    return {
      isValid: withinGeofence && accuracyOk,
      distanceMeters: Math.round(distance * 100) / 100,
      expectedAddress: geofence.address || 'Address on file',
      actualCoordinates: coordinates,
      accuracyMeters: coordinates.accuracy || 0,
      withinGeofence,
    };
  }

  /**
   * Create or update patient geofence
   */
  async upsertGeofence(
    patientId: string,
    data: Partial<Geofence>,
  ): Promise<Geofence> {
    let geofence = await this.geofenceRepo.findOne({
      where: { patientId, isPrimary: true },
    });

    if (geofence) {
      Object.assign(geofence, data);
    } else {
      geofence = this.geofenceRepo.create({
        patientId,
        ...data,
        isPrimary: true,
        isActive: true,
      });
    }

    return this.geofenceRepo.save(geofence);
  }

  /**
   * Get all geofences for a patient
   */
  async getPatientGeofences(patientId: string): Promise<Geofence[]> {
    return this.geofenceRepo.find({
      where: { patientId, isActive: true },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
  }

  /**
   * Geocode address to coordinates (integration point for external API)
   */
  async geocodeAddress(address: string): Promise<GpsCoordinates | null> {
    // In production, integrate with Google Maps, MapBox, or similar
    this.logger.log(`Geocoding address: ${address}`);
    // Placeholder - return null to indicate external API integration needed
    return null;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
