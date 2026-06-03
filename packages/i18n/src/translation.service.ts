/**
 * Translation Service
 * Manages translations and message formatting
 */

import { Injectable, Inject, Optional } from '@nestjs/common';
import { IntlMessageFormat } from 'intl-messageformat';
import {
  SupportedLocale,
  TranslationNamespace,
  TranslationResource,
  DEFAULT_LOCALE,
} from './types';

export interface TranslationServiceOptions {
  defaultLocale?: SupportedLocale;
  fallbackLocale?: SupportedLocale;
  debug?: boolean;
}

// English translations (Canadian)
const EN_CA_TRANSLATIONS: Record<TranslationNamespace, TranslationResource> = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    update: 'Update',
    search: 'Search',
    filter: 'Filter',
    loading: 'Loading...',
    noResults: 'No results found',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    close: 'Close',
    actions: 'Actions',
    status: 'Status',
    details: 'Details',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Log out',
    welcome: 'Welcome, {name}!',
    itemsPerPage: '{count, plural, one {# item} other {# items}} per page',
    pagination: 'Page {current} of {total}',
  },
  auth: {
    login: 'Log In',
    logout: 'Log Out',
    register: 'Register',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    rememberMe: 'Remember me',
    loginSuccess: 'Successfully logged in',
    loginFailed: 'Invalid email or password',
    sessionExpired: 'Your session has expired. Please log in again.',
    passwordRequirements: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
  },
  caregivers: {
    caregiver: 'Caregiver',
    caregivers: 'Caregivers',
    addCaregiver: 'Add Caregiver',
    editCaregiver: 'Edit Caregiver',
    caregiverProfile: 'Caregiver Profile',
    availability: 'Availability',
    skills: 'Skills',
    certifications: 'Certifications',
    experience: 'Experience',
    rating: 'Rating',
    assignedPatients: 'Assigned Patients',
    totalShifts: 'Total Shifts',
    completionRate: 'Completion Rate',
    backgroundCheck: 'Background Check',
    training: 'Training',
    documents: 'Documents',
  },
  patients: {
    patient: 'Patient',
    patients: 'Patients',
    addPatient: 'Add Patient',
    editPatient: 'Edit Patient',
    patientProfile: 'Patient Profile',
    careLevel: 'Care Level',
    conditions: 'Conditions',
    medications: 'Medications',
    allergies: 'Allergies',
    emergencyContact: 'Emergency Contact',
    carePlan: 'Care Plan',
    vitals: 'Vital Signs',
    appointments: 'Appointments',
    notes: 'Clinical Notes',
  },
  scheduling: {
    schedule: 'Schedule',
    shift: 'Shift',
    shifts: 'Shifts',
    createShift: 'Create Shift',
    editShift: 'Edit Shift',
    assignCaregiver: 'Assign Caregiver',
    startTime: 'Start Time',
    endTime: 'End Time',
    duration: 'Duration',
    recurring: 'Recurring',
    clockIn: 'Clock In',
    clockOut: 'Clock Out',
    breakStart: 'Start Break',
    breakEnd: 'End Break',
    evvVerified: 'EVV Verified',
    pending: 'Pending',
    confirmed: 'Confirmed',
    inProgress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    noShow: 'No Show',
  },
  clinical: {
    vitals: 'Vital Signs',
    bloodPressure: 'Blood Pressure',
    heartRate: 'Heart Rate',
    temperature: 'Temperature',
    oxygenSaturation: 'Oxygen Saturation',
    bloodGlucose: 'Blood Glucose',
    weight: 'Weight',
    height: 'Height',
    medication: 'Medication',
    medications: 'Medications',
    dosage: 'Dosage',
    frequency: 'Frequency',
    administered: 'Administered',
    refused: 'Refused',
    missedDose: 'Missed Dose',
    sideEffects: 'Side Effects',
    clinicalNotes: 'Clinical Notes',
    assessment: 'Assessment',
    diagnosis: 'Diagnosis',
    treatment: 'Treatment',
  },
  billing: {
    invoice: 'Invoice',
    invoices: 'Invoices',
    payment: 'Payment',
    payments: 'Payments',
    amount: 'Amount',
    dueDate: 'Due Date',
    paid: 'Paid',
    unpaid: 'Unpaid',
    overdue: 'Overdue',
    billingPeriod: 'Billing Period',
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'Total',
    paymentMethod: 'Payment Method',
    creditCard: 'Credit Card',
    bankTransfer: 'Bank Transfer',
    generateInvoice: 'Generate Invoice',
  },
  errors: {
    generic: 'An error occurred. Please try again.',
    notFound: 'The requested resource was not found.',
    unauthorized: 'You are not authorized to perform this action.',
    forbidden: 'Access denied.',
    validation: 'Please check your input and try again.',
    network: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    timeout: 'Request timed out. Please try again.',
    conflict: 'This action conflicts with existing data.',
    quotaExceeded: 'You have reached the limit for {resource}.',
  },
  notifications: {
    shiftAssigned: 'You have been assigned a new shift on {date}',
    shiftCancelled: 'Shift on {date} has been cancelled',
    shiftReminder: 'Reminder: You have a shift in {time}',
    documentExpiring: '{document} expires in {days} days',
    messageReceived: 'New message from {sender}',
    patientUpdate: 'Update for patient {patient}',
    systemMaintenance: 'System maintenance scheduled for {date}',
  },
  reports: {
    report: 'Report',
    reports: 'Reports',
    generate: 'Generate Report',
    export: 'Export',
    dateRange: 'Date Range',
    startDate: 'Start Date',
    endDate: 'End Date',
    summary: 'Summary',
    detailed: 'Detailed',
    caregiverReport: 'Caregiver Report',
    patientReport: 'Patient Report',
    billingReport: 'Billing Report',
    scheduleReport: 'Schedule Report',
    complianceReport: 'Compliance Report',
  },
};

// French translations (Canadian)
const FR_CA_TRANSLATIONS: Record<TranslationNamespace, TranslationResource> = {
  common: {
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    create: 'Créer',
    update: 'Mettre à jour',
    search: 'Rechercher',
    filter: 'Filtrer',
    loading: 'Chargement...',
    noResults: 'Aucun résultat trouvé',
    confirm: 'Confirmer',
    yes: 'Oui',
    no: 'Non',
    back: 'Retour',
    next: 'Suivant',
    submit: 'Soumettre',
    close: 'Fermer',
    actions: 'Actions',
    status: 'Statut',
    details: 'Détails',
    settings: 'Paramètres',
    profile: 'Profil',
    logout: 'Déconnexion',
    welcome: 'Bienvenue, {name} !',
    itemsPerPage: '{count, plural, one {# élément} other {# éléments}} par page',
    pagination: 'Page {current} sur {total}',
  },
  auth: {
    login: 'Connexion',
    logout: 'Déconnexion',
    register: 'S\'inscrire',
    forgotPassword: 'Mot de passe oublié ?',
    resetPassword: 'Réinitialiser le mot de passe',
    email: 'Courriel',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    rememberMe: 'Se souvenir de moi',
    loginSuccess: 'Connexion réussie',
    loginFailed: 'Courriel ou mot de passe invalide',
    sessionExpired: 'Votre session a expiré. Veuillez vous reconnecter.',
    passwordRequirements: 'Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules et chiffres',
  },
  caregivers: {
    caregiver: 'Aidant',
    caregivers: 'Aidants',
    addCaregiver: 'Ajouter un aidant',
    editCaregiver: 'Modifier l\'aidant',
    caregiverProfile: 'Profil de l\'aidant',
    availability: 'Disponibilité',
    skills: 'Compétences',
    certifications: 'Certifications',
    experience: 'Expérience',
    rating: 'Évaluation',
    assignedPatients: 'Patients assignés',
    totalShifts: 'Total des quarts',
    completionRate: 'Taux de complétion',
    backgroundCheck: 'Vérification des antécédents',
    training: 'Formation',
    documents: 'Documents',
  },
  patients: {
    patient: 'Patient',
    patients: 'Patients',
    addPatient: 'Ajouter un patient',
    editPatient: 'Modifier le patient',
    patientProfile: 'Profil du patient',
    careLevel: 'Niveau de soins',
    conditions: 'Conditions',
    medications: 'Médicaments',
    allergies: 'Allergies',
    emergencyContact: 'Contact d\'urgence',
    carePlan: 'Plan de soins',
    vitals: 'Signes vitaux',
    appointments: 'Rendez-vous',
    notes: 'Notes cliniques',
  },
  scheduling: {
    schedule: 'Horaire',
    shift: 'Quart',
    shifts: 'Quarts',
    createShift: 'Créer un quart',
    editShift: 'Modifier le quart',
    assignCaregiver: 'Assigner un aidant',
    startTime: 'Heure de début',
    endTime: 'Heure de fin',
    duration: 'Durée',
    recurring: 'Récurrent',
    clockIn: 'Pointer à l\'arrivée',
    clockOut: 'Pointer au départ',
    breakStart: 'Début de pause',
    breakEnd: 'Fin de pause',
    evvVerified: 'Vérifié EVV',
    pending: 'En attente',
    confirmed: 'Confirmé',
    inProgress: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
    noShow: 'Absence',
  },
  clinical: {
    vitals: 'Signes vitaux',
    bloodPressure: 'Pression artérielle',
    heartRate: 'Fréquence cardiaque',
    temperature: 'Température',
    oxygenSaturation: 'Saturation en oxygène',
    bloodGlucose: 'Glycémie',
    weight: 'Poids',
    height: 'Taille',
    medication: 'Médicament',
    medications: 'Médicaments',
    dosage: 'Dosage',
    frequency: 'Fréquence',
    administered: 'Administré',
    refused: 'Refusé',
    missedDose: 'Dose manquée',
    sideEffects: 'Effets secondaires',
    clinicalNotes: 'Notes cliniques',
    assessment: 'Évaluation',
    diagnosis: 'Diagnostic',
    treatment: 'Traitement',
  },
  billing: {
    invoice: 'Facture',
    invoices: 'Factures',
    payment: 'Paiement',
    payments: 'Paiements',
    amount: 'Montant',
    dueDate: 'Date d\'échéance',
    paid: 'Payé',
    unpaid: 'Impayé',
    overdue: 'En retard',
    billingPeriod: 'Période de facturation',
    subtotal: 'Sous-total',
    tax: 'Taxes',
    total: 'Total',
    paymentMethod: 'Mode de paiement',
    creditCard: 'Carte de crédit',
    bankTransfer: 'Virement bancaire',
    generateInvoice: 'Générer une facture',
  },
  errors: {
    generic: 'Une erreur s\'est produite. Veuillez réessayer.',
    notFound: 'La ressource demandée est introuvable.',
    unauthorized: 'Vous n\'êtes pas autorisé à effectuer cette action.',
    forbidden: 'Accès refusé.',
    validation: 'Veuillez vérifier vos données et réessayer.',
    network: 'Erreur réseau. Veuillez vérifier votre connexion.',
    serverError: 'Erreur serveur. Veuillez réessayer plus tard.',
    timeout: 'Délai dépassé. Veuillez réessayer.',
    conflict: 'Cette action entre en conflit avec des données existantes.',
    quotaExceeded: 'Vous avez atteint la limite pour {resource}.',
  },
  notifications: {
    shiftAssigned: 'Un nouveau quart vous a été assigné le {date}',
    shiftCancelled: 'Le quart du {date} a été annulé',
    shiftReminder: 'Rappel : Vous avez un quart dans {time}',
    documentExpiring: '{document} expire dans {days} jours',
    messageReceived: 'Nouveau message de {sender}',
    patientUpdate: 'Mise à jour pour le patient {patient}',
    systemMaintenance: 'Maintenance système prévue le {date}',
  },
  reports: {
    report: 'Rapport',
    reports: 'Rapports',
    generate: 'Générer un rapport',
    export: 'Exporter',
    dateRange: 'Période',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    summary: 'Résumé',
    detailed: 'Détaillé',
    caregiverReport: 'Rapport des aidants',
    patientReport: 'Rapport des patients',
    billingReport: 'Rapport de facturation',
    scheduleReport: 'Rapport des horaires',
    complianceReport: 'Rapport de conformité',
  },
};

// All translations
const TRANSLATIONS: Record<SupportedLocale, Record<TranslationNamespace, TranslationResource>> = {
  'en-CA': EN_CA_TRANSLATIONS,
  'fr-CA': FR_CA_TRANSLATIONS,
  'en-US': EN_CA_TRANSLATIONS, // Use en-CA as base
  'fr-FR': FR_CA_TRANSLATIONS, // Use fr-CA as base
};

@Injectable()
export class TranslationService {
  private locale: SupportedLocale;
  private fallbackLocale: SupportedLocale;
  private messageCache = new Map<string, IntlMessageFormat>();
  private debug: boolean;

  constructor(@Optional() @Inject('I18N_OPTIONS') options?: TranslationServiceOptions) {
    this.locale = options?.defaultLocale || DEFAULT_LOCALE;
    this.fallbackLocale = options?.fallbackLocale || 'en-CA';
    this.debug = options?.debug || false;
  }

  /**
   * Set the current locale
   */
  setLocale(locale: SupportedLocale): void {
    this.locale = locale;
    this.messageCache.clear();
  }

  /**
   * Get current locale
   */
  getLocale(): SupportedLocale {
    return this.locale;
  }

  /**
   * Translate a key
   */
  t(
    namespace: TranslationNamespace,
    key: string,
    params?: Record<string, any>,
  ): string {
    const fullKey = `${namespace}.${key}`;

    // Try current locale
    let message = this.getMessage(this.locale, namespace, key);

    // Fallback to fallback locale
    if (!message && this.locale !== this.fallbackLocale) {
      message = this.getMessage(this.fallbackLocale, namespace, key);
    }

    if (!message) {
      if (this.debug) {
        console.warn(`Missing translation: ${fullKey}`);
      }
      return fullKey;
    }

    // Format with parameters
    if (params) {
      return this.formatMessage(fullKey, message, params);
    }

    return message;
  }

  /**
   * Translate with namespace shorthand
   */
  translate(
    key: string, // Format: "namespace.key"
    params?: Record<string, any>,
  ): string {
    const [namespace, ...rest] = key.split('.');
    const translationKey = rest.join('.');
    return this.t(namespace as TranslationNamespace, translationKey, params);
  }

  /**
   * Check if translation exists
   */
  has(namespace: TranslationNamespace, key: string): boolean {
    return this.getMessage(this.locale, namespace, key) !== undefined;
  }

  /**
   * Get all translations for a namespace
   */
  getNamespace(namespace: TranslationNamespace): TranslationResource {
    return TRANSLATIONS[this.locale]?.[namespace] || {};
  }

  /**
   * Get all supported locales
   */
  getSupportedLocales(): SupportedLocale[] {
    return Object.keys(TRANSLATIONS) as SupportedLocale[];
  }

  private getMessage(
    locale: SupportedLocale,
    namespace: TranslationNamespace,
    key: string,
  ): string | undefined {
    const namespaceTranslations = TRANSLATIONS[locale]?.[namespace];
    if (!namespaceTranslations) return undefined;

    // Handle nested keys
    const keys = key.split('.');
    let value: any = namespaceTranslations;

    for (const k of keys) {
      if (value === undefined || typeof value !== 'object') return undefined;
      value = value[k];
    }

    return typeof value === 'string' ? value : undefined;
  }

  private formatMessage(
    cacheKey: string,
    message: string,
    params: Record<string, any>,
  ): string {
    try {
      let formatter = this.messageCache.get(cacheKey);

      if (!formatter) {
        formatter = new IntlMessageFormat(message, this.locale);
        this.messageCache.set(cacheKey, formatter);
      }

      return formatter.format(params) as string;
    } catch (error) {
      if (this.debug) {
        console.error(`Error formatting message: ${cacheKey}`, error);
      }
      return message;
    }
  }
}
