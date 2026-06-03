import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Badge,
  Card,
  CardBody,
  Icon,
  Flex,
  Spacer,
  useColorModeValue,
  Spinner,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  FormControl,
  FormLabel,
  useToast,
  Divider,
} from '@chakra-ui/react';
import {
  FiBriefcase,
  FiMapPin,
  FiDollarSign,
  FiClock,
  FiStar,
  FiSend,
  FiEye,
  FiCheckCircle,
  FiRefreshCw,
  FiCalendar,
  FiAward,
  FiX,
} from 'react-icons/fi';

// ============================================================================
// Types
// ============================================================================

interface JobPosting {
  id: string;
  title: string;
  agency_name?: string;
  location_city?: string;
  location_province?: string;
  pay_rate_min?: number;
  pay_rate_max?: number;
  pay_type: string;
  job_type: string;
  required_credentials: string[];
  is_featured?: boolean;
  match_score?: number;
  applications_count: number;
  posted_at?: string;
}

interface JobApplication {
  id: string;
  job_posting: JobPosting;
  status: string;
  applied_at: string;
  match_score?: number;
}

// ============================================================================
// Mock Data
// ============================================================================

const mockJobs: JobPosting[] = [
  {
    id: '1',
    title: 'Personal Support Worker - Full Time',
    agency_name: 'CareFirst Home Health',
    location_city: 'Toronto',
    location_province: 'ON',
    pay_rate_min: 22,
    pay_rate_max: 28,
    pay_type: 'hourly',
    job_type: 'full-time',
    required_credentials: ['PSW', 'First Aid'],
    is_featured: true,
    match_score: 0.92,
    applications_count: 15,
    posted_at: '2 days ago',
  },
  {
    id: '2',
    title: 'Registered Nurse - Weekend Shifts',
    agency_name: 'Maple Leaf Care',
    location_city: 'Mississauga',
    location_province: 'ON',
    pay_rate_min: 38,
    pay_rate_max: 45,
    pay_type: 'hourly',
    job_type: 'part-time',
    required_credentials: ['RN', 'BLS'],
    match_score: 0.85,
    applications_count: 8,
    posted_at: '1 day ago',
  },
  {
    id: '3',
    title: 'Home Care Aide - Live-In',
    agency_name: 'Golden Years Home Care',
    location_city: 'Vancouver',
    location_province: 'BC',
    pay_rate_min: 200,
    pay_rate_max: 250,
    pay_type: 'per day',
    job_type: 'live-in',
    required_credentials: ['HCA'],
    match_score: 0.78,
    applications_count: 5,
    posted_at: '3 days ago',
  },
];

const mockApplications: JobApplication[] = [
  {
    id: 'app-1',
    job_posting: mockJobs[0],
    status: 'interview_scheduled',
    applied_at: '2024-01-05',
    match_score: 0.92,
  },
  {
    id: 'app-2',
    job_posting: mockJobs[1],
    status: 'reviewed',
    applied_at: '2024-01-03',
    match_score: 0.85,
  },
];

// ============================================================================
// Components
// ============================================================================

interface JobCardProps {
  job: JobPosting;
  onApply: (job: JobPosting) => void;
  onView: (job: JobPosting) => void;
}

function JobCard({ job, onApply, onView }: JobCardProps) {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Card
      bg={cardBg}
      borderColor={borderColor}
      borderWidth="1px"
      borderRadius="xl"
      mb={3}
      shadow="sm"
      _hover={{ shadow: 'md' }}
      transition="all 0.2s"
    >
      <CardBody p={4}>
        {/* Header */}
        <HStack mb={2} spacing={2}>
          {job.is_featured && (
            <Badge colorScheme="yellow" fontSize="xs">
              <Icon as={FiStar} mr={1} />
              Featured
            </Badge>
          )}
          {job.match_score && job.match_score > 0.8 && (
            <Badge colorScheme="green" fontSize="xs">
              <Icon as={FiCheckCircle} mr={1} />
              {Math.round(job.match_score * 100)}% Match
            </Badge>
          )}
          <Spacer />
          <Text fontSize="xs" color="gray.500">
            {job.posted_at}
          </Text>
        </HStack>

        {/* Title */}
        <Heading size="sm" mb={1} noOfLines={2}>
          {job.title}
        </Heading>

        {/* Agency */}
        {job.agency_name && (
          <Text fontSize="sm" color="gray.600" mb={2}>
            {job.agency_name}
          </Text>
        )}

        {/* Details */}
        <VStack align="stretch" spacing={1} mb={3}>
          <HStack fontSize="sm" color="gray.500">
            <Icon as={FiMapPin} />
            <Text>
              {[job.location_city, job.location_province].filter(Boolean).join(', ')}
            </Text>
          </HStack>
          <HStack fontSize="sm" color="gray.500">
            <Icon as={FiDollarSign} />
            <Text>
              ${job.pay_rate_min}
              {job.pay_rate_max && ` - $${job.pay_rate_max}`} / {job.pay_type}
            </Text>
          </HStack>
          <HStack fontSize="sm" color="gray.500">
            <Icon as={FiBriefcase} />
            <Text textTransform="capitalize">{job.job_type}</Text>
          </HStack>
        </VStack>

        {/* Credentials */}
        <HStack flexWrap="wrap" mb={3} spacing={1}>
          {job.required_credentials.slice(0, 3).map((cred) => (
            <Badge key={cred} colorScheme="blue" fontSize="xs" variant="subtle">
              {cred}
            </Badge>
          ))}
          {job.required_credentials.length > 3 && (
            <Badge colorScheme="gray" fontSize="xs" variant="subtle">
              +{job.required_credentials.length - 3}
            </Badge>
          )}
        </HStack>

        {/* Actions */}
        <HStack spacing={2}>
          <Button
            flex={1}
            size="sm"
            variant="outline"
            leftIcon={<Icon as={FiEye} />}
            onClick={() => onView(job)}
          >
            View
          </Button>
          <Button
            flex={1}
            size="sm"
            colorScheme="green"
            leftIcon={<Icon as={FiSend} />}
            onClick={() => onApply(job)}
          >
            Apply
          </Button>
        </HStack>
      </CardBody>
    </Card>
  );
}

interface ApplicationCardProps {
  application: JobApplication;
  onView: (app: JobApplication) => void;
}

function ApplicationCard({ application, onView }: ApplicationCardProps) {
  const cardBg = useColorModeValue('white', 'gray.700');

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: 'blue',
      reviewed: 'orange',
      shortlisted: 'purple',
      interview_scheduled: 'green',
      interviewed: 'teal',
      offered: 'green',
      hired: 'green',
      rejected: 'red',
      withdrawn: 'gray',
    };
    return colors[status] || 'gray';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      applied: 'Applied',
      reviewed: 'Under Review',
      shortlisted: 'Shortlisted',
      interview_scheduled: 'Interview Scheduled',
      interviewed: 'Interviewed',
      offer_pending: 'Offer Pending',
      offered: 'Offer Received',
      hired: 'Hired',
      rejected: 'Not Selected',
      withdrawn: 'Withdrawn',
    };
    return labels[status] || status;
  };

  return (
    <Card bg={cardBg} borderRadius="xl" mb={3} shadow="sm">
      <CardBody p={4}>
        <HStack justify="space-between" mb={2}>
          <Badge colorScheme={getStatusColor(application.status)} fontSize="xs">
            {getStatusLabel(application.status)}
          </Badge>
          <Text fontSize="xs" color="gray.500">
            Applied {new Date(application.applied_at).toLocaleDateString()}
          </Text>
        </HStack>

        <Heading size="sm" mb={1} noOfLines={2}>
          {application.job_posting.title}
        </Heading>

        <Text fontSize="sm" color="gray.600" mb={2}>
          {application.job_posting.agency_name}
        </Text>

        <HStack fontSize="sm" color="gray.500" mb={3}>
          <Icon as={FiMapPin} />
          <Text>
            {[application.job_posting.location_city, application.job_posting.location_province]
              .filter(Boolean)
              .join(', ')}
          </Text>
        </HStack>

        <Button
          size="sm"
          variant="outline"
          width="full"
          leftIcon={<Icon as={FiEye} />}
          onClick={() => onView(application)}
        >
          View Details
        </Button>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function MobileDashboard() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bgGradient = useColorModeValue(
    'linear(to-b, green.50, white)',
    'linear(to-b, gray.800, gray.900)'
  );
  const headerBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setJobs(mockJobs);
      setApplications(mockApplications);
      setLoading(false);
    }, 1000);
  }, []);

  const handleApply = (job: JobPosting) => {
    setSelectedJob(job);
    setCoverLetter('');
    onOpen();
  };

  const handleSubmitApplication = () => {
    // Simulate API call
    toast({
      title: 'Application Submitted!',
      description: `Your application for "${selectedJob?.title}" has been sent.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    onClose();
    
    // Add to applications
    if (selectedJob) {
      const newApp: JobApplication = {
        id: `app-${Date.now()}`,
        job_posting: selectedJob,
        status: 'applied',
        applied_at: new Date().toISOString(),
        match_score: selectedJob.match_score,
      };
      setApplications([newApp, ...applications]);
    }
  };

  const handleViewJob = (job: JobPosting) => {
    toast({
      title: 'Job Details',
      description: `Viewing details for: ${job.title}`,
      status: 'info',
      duration: 2000,
    });
  };

  const handleViewApplication = (app: JobApplication) => {
    toast({
      title: 'Application Details',
      description: `Viewing application for: ${app.job_posting.title}`,
      status: 'info',
      duration: 2000,
    });
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: 'Refreshed',
        status: 'success',
        duration: 1500,
      });
    }, 1000);
  };

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bgGradient={bgGradient}>
        <VStack>
          <Spinner size="xl" color="green.500" thickness="4px" />
          <Text color="gray.500" mt={4}>
            Loading opportunities...
          </Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      {/* Header */}
      <Box
        bg={headerBg}
        px={4}
        py={4}
        position="sticky"
        top={0}
        zIndex={10}
        shadow="sm"
      >
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Heading size="md" bgGradient="linear(to-r, green.500, blue.500)" bgClip="text">
              Job Opportunities
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Find your next caregiving role
            </Text>
          </VStack>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            isLoading={loading}
          >
            <Icon as={FiRefreshCw} />
          </Button>
        </HStack>
      </Box>

      {/* Content */}
      <Box px={4} py={4}>
        <Tabs colorScheme="green" variant="soft-rounded">
          <TabList mb={4}>
            <Tab fontSize="sm">
              <Icon as={FiBriefcase} mr={2} />
              Jobs ({jobs.length})
            </Tab>
            <Tab fontSize="sm">
              <Icon as={FiSend} mr={2} />
              Applications ({applications.length})
            </Tab>
          </TabList>

          <TabPanels>
            {/* Jobs Tab */}
            <TabPanel p={0}>
              {jobs.length === 0 ? (
                <Card borderRadius="xl" p={8} textAlign="center">
                  <Icon as={FiBriefcase} boxSize={12} color="gray.300" mb={4} />
                  <Heading size="sm" color="gray.600" mb={2}>
                    No Jobs Available
                  </Heading>
                  <Text color="gray.500" fontSize="sm">
                    Check back later for new opportunities
                  </Text>
                </Card>
              ) : (
                <VStack spacing={0} align="stretch">
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onApply={handleApply}
                      onView={handleViewJob}
                    />
                  ))}
                </VStack>
              )}
            </TabPanel>

            {/* Applications Tab */}
            <TabPanel p={0}>
              {applications.length === 0 ? (
                <Card borderRadius="xl" p={8} textAlign="center">
                  <Icon as={FiSend} boxSize={12} color="gray.300" mb={4} />
                  <Heading size="sm" color="gray.600" mb={2}>
                    No Applications Yet
                  </Heading>
                  <Text color="gray.500" fontSize="sm">
                    Apply to jobs to track your applications here
                  </Text>
                </Card>
              ) : (
                <VStack spacing={0} align="stretch">
                  {applications.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      onView={handleViewApplication}
                    />
                  ))}
                </VStack>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Apply Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay />
        <ModalContent m={0} borderRadius={0}>
          <ModalHeader borderBottomWidth="1px">
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" color="gray.500">
                Apply to
              </Text>
              <Heading size="sm">{selectedJob?.title}</Heading>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody py={4}>
            <VStack spacing={4} align="stretch">
              {/* Job Summary */}
              <Card variant="outline" borderRadius="lg">
                <CardBody py={3} px={4}>
                  <HStack spacing={4} fontSize="sm" color="gray.600">
                    <HStack>
                      <Icon as={FiMapPin} />
                      <Text>
                        {[selectedJob?.location_city, selectedJob?.location_province]
                          .filter(Boolean)
                          .join(', ')}
                      </Text>
                    </HStack>
                    <HStack>
                      <Icon as={FiDollarSign} />
                      <Text>
                        ${selectedJob?.pay_rate_min}
                        {selectedJob?.pay_rate_max && ` - $${selectedJob?.pay_rate_max}`}
                      </Text>
                    </HStack>
                  </HStack>
                </CardBody>
              </Card>

              {/* Match Score */}
              {selectedJob?.match_score && selectedJob.match_score > 0.7 && (
                <Card bg="green.50" borderRadius="lg" borderColor="green.200" borderWidth="1px">
                  <CardBody py={3} px={4}>
                    <HStack>
                      <Icon as={FiCheckCircle} color="green.500" />
                      <Text fontSize="sm" color="green.700" fontWeight="medium">
                        You're a {Math.round(selectedJob.match_score * 100)}% match for this role!
                      </Text>
                    </HStack>
                  </CardBody>
                </Card>
              )}

              {/* Cover Letter */}
              <FormControl>
                <FormLabel>Cover Letter (Optional)</FormLabel>
                <Textarea
                  placeholder="Tell the agency why you're a great fit for this role..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={6}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter borderTopWidth="1px" gap={2}>
            <Button variant="ghost" onClick={onClose} flex={1}>
              Cancel
            </Button>
            <Button colorScheme="green" onClick={handleSubmitApplication} flex={1}>
              <Icon as={FiSend} mr={2} />
              Submit Application
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
