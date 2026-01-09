# Ransomware Attack Recovery Runbook

## Incident Classification
- **Severity**: P0 (Catastrophic)
- **RTO**: 24-48 hours
- **RPO**: Best available backup (may be days old)

## ⚠️ CRITICAL: First 30 Minutes

### 1. ISOLATE IMMEDIATELY
```bash
# Disable all network access
aws ec2 modify-vpc-attribute \
  --vpc-id <vpc-id> \
  --no-enable-dns-support

# Stop all running services
kubectl scale deployment --all --replicas=0 -n medi-aide

# Revoke all access keys
aws iam list-access-keys --user-name <compromised-user>
aws iam delete-access-key --user-name <compromised-user> --access-key-id <key-id>
```

### 2. DO NOT PAY RANSOM
- Contact law enforcement
- Contact cyber insurance carrier
- Engage incident response vendor

### 3. PRESERVE EVIDENCE
```bash
# Snapshot all volumes
for volume in $(aws ec2 describe-volumes --query 'Volumes[*].VolumeId' --output text); do
  aws ec2 create-snapshot --volume-id $volume --description "Ransomware-investigation-$(date +%s)"
done

# Export all logs
aws logs create-export-task \
  --log-group-name /aws/eks/medi-aide \
  --from $(date -d "7 days ago" +%s000) \
  --to $(date +%s000) \
  --destination medi-aide-incident-logs
```

## Immediate Contacts

| Role | Contact | Notes |
|------|---------|-------|
| FBI Cyber | ic3.gov | File report |
| Canadian Cyber Centre | cyber.gc.ca | Required for Canadian healthcare |
| Cyber Insurance | [policy number] | Activate coverage |
| Legal Counsel | [contact] | Data breach implications |
| IR Vendor | [contact] | Forensics |

## Assessment Phase (Hours 1-4)

### Determine Scope
```bash
# Check for encrypted files
find /var/lib/postgresql -name "*.encrypted" -o -name "*.locked"

# Check for ransom notes
find / -name "README*.txt" -o -name "DECRYPT*.txt" 2>/dev/null

# Check backup integrity
./scripts/verify-backups.sh
```

### Timeline Construction
1. When did the attack start?
2. What was the entry point?
3. What systems are affected?
4. Are backups compromised?

## Recovery Decision Tree

```
Is the attacker still active?
├── YES → Continue isolation, engage IR team
└── NO → Proceed to recovery
          │
          ├── Are off-site backups intact?
          │   ├── YES → Proceed to clean room recovery
          │   └── NO → Evaluate reconstruction options
          │
          └── Is the encryption known/breakable?
              ├── YES → Attempt decryption
              └── NO → Restore from backup
```

## Clean Room Recovery

### Step 1: Create Isolated Environment
```bash
# Create new VPC
aws ec2 create-vpc --cidr-block 10.99.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=cleanroom}]'

# No internet access initially
# No connection to compromised environment
```

### Step 2: Deploy Clean Infrastructure
```bash
# Deploy fresh EKS cluster
eksctl create cluster \
  --name medi-aide-recovery \
  --region ca-central-1 \
  --vpc-private-subnets <clean-subnets>

# Deploy from known-good container images
# Use images from BEFORE attack date
```

### Step 3: Restore from Off-Site Backup
```bash
# Use backup from BEFORE attack
# Verify backup integrity first

# Calculate safe restore point
# Rule: 2 weeks before earliest known compromise

RESTORE_DATE="2024-01-01"  # Example - use actual safe date

./scripts/restore-database.sh $RESTORE_DATE --target cleanroom
```

### Step 4: Data Validation
```bash
# Check for signs of compromise in data
psql -c "SELECT * FROM audit_logs WHERE action = 'UNUSUAL_PATTERN';"

# Verify data integrity
./scripts/full-data-validation.sh

# Compare record counts with known good state
```

## Patient Notification Requirements

### HIPAA Breach Notification
- **60-day deadline** for individual notification
- **HHS notification** required if >500 individuals
- **Media notification** if >500 in a state

### PIPEDA Requirements (Canada)
- Report to Privacy Commissioner if "real risk of significant harm"
- Notify affected individuals
- Document the breach

### Template
```
NOTICE OF DATA SECURITY INCIDENT

We are writing to inform you about a security incident that may 
have affected your personal health information...

[Details of what happened]
[What information was affected]
[Steps we're taking]
[Steps you can take]
[Contact information]
```

## System Hardening Before Reconnection

### 1. Credential Reset
```bash
# Rotate ALL credentials
# - Database passwords
# - API keys
# - Service account tokens
# - Admin passwords
# - SSO secrets

./scripts/rotate-all-credentials.sh
```

### 2. Security Improvements
- Enable MFA on all accounts
- Implement network segmentation
- Deploy EDR on all systems
- Enable enhanced logging
- Implement privileged access management

### 3. Verification
- Penetration test clean environment
- Verify no persistence mechanisms
- Validate all access controls

## Post-Recovery Monitoring

### 30-Day Watch Period
- 24/7 SOC monitoring
- Enhanced alerting thresholds
- Daily security scans
- Threat hunting activities

### Key Indicators to Monitor
- Unusual authentication patterns
- Outbound data transfers
- New scheduled tasks/cron jobs
- Modified system files
- Unexpected network connections

## Lessons Learned Template

### Post-Incident Review (90 days)
1. **Timeline**: Detailed attack timeline
2. **Entry Point**: How did attackers get in?
3. **Dwell Time**: How long were they in?
4. **Detection**: Why wasn't it detected earlier?
5. **Response**: What worked? What didn't?
6. **Improvements**: Specific action items

### Required Improvements
- [ ] Implement immutable backups
- [ ] Enhanced monitoring
- [ ] Network segmentation
- [ ] Zero trust architecture
- [ ] Regular tabletop exercises
- [ ] Employee security training

## Budget Considerations

| Item | Estimated Cost |
|------|----------------|
| Incident Response Vendor | $50,000-$200,000 |
| Forensics | $25,000-$100,000 |
| Legal Fees | $50,000-$150,000 |
| Notification Costs | $1-$5 per individual |
| Credit Monitoring | $100-$200 per person |
| System Rebuild | Variable |
| Reputation Damage | Immeasurable |

## Prevention for Next Time

1. **Air-gapped backups**: Store backups offline
2. **Immutable storage**: Use WORM (Write Once Read Many)
3. **Network segmentation**: Limit lateral movement
4. **Zero trust**: Verify everything
5. **Endpoint protection**: Modern EDR on all systems
6. **Security awareness**: Regular phishing simulations
7. **Patch management**: Stay current on updates
8. **Incident response plan**: Test regularly
