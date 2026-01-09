import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Button,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Link,
  Icon,
} from '@chakra-ui/react';
import {
  getProfile,
  getBadges,
  getUserBadges,
  getLeaderboard,
  GamificationProfile,
  BadgeDefinition,
  UserBadge,
  LeaderboardEntry,
} from '../lib/api';
import PointsCard from './PointsCard';
import BadgeGrid from './BadgeGrid';
import LeaderboardTable from './LeaderboardTable';

// Mock user ID - in production this would come from auth context
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function TrainingDashboard() {
  // State
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('alltime');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Colors
  const bgGradient = useColorModeValue(
    'linear(to-br, purple.50, pink.50)',
    'linear(to-br, gray.900, gray.800)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profileData, badgesData, userBadgesData, leaderboardData] = await Promise.all([
        getProfile(MOCK_USER_ID),
        getBadges(),
        getUserBadges(MOCK_USER_ID),
        getLeaderboard(leaderboardPeriod, 10),
      ]);
      setProfile(profileData);
      setBadges(badgesData);
      setUserBadges(userBadgesData);
      setLeaderboard(leaderboardData);
      setError(null);
    } catch (err) {
      setError('Failed to load gamification data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [leaderboardPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle leaderboard period change
  const handlePeriodChange = async (period: 'weekly' | 'monthly' | 'alltime') => {
    setLeaderboardPeriod(period);
    try {
      const data = await getLeaderboard(period, 10);
      setLeaderboard(data);
    } catch (err) {
      // Keep existing data on error
    }
  };

  if (isLoading) {
    return (
      <Center minH="100vh" bgGradient={bgGradient}>
        <Spinner size="xl" color="purple.500" thickness="4px" />
      </Center>
    );
  }

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      <Container maxW="container.xl" py={8}>
        {/* Header */}
        <VStack spacing={2} mb={8} align="flex-start">
          <Heading
            size="xl"
            bgGradient="linear(to-r, purple.500, pink.500)"
            bgClip="text"
          >
            Training Portal
          </Heading>
          <Text color="gray.500">
            Track your progress, earn badges, and climb the leaderboard!
          </Text>
        </VStack>

        {error && (
          <Alert status="error" mb={4} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Tabs colorScheme="purple" variant="enclosed">
          <TabList>
            <Tab>📊 My Progress</Tab>
            <Tab>🏆 Leaderboard</Tab>
            <Tab>📚 Training Courses</Tab>
          </TabList>

          <TabPanels>
            {/* My Progress Tab */}
            <TabPanel px={0}>
              <VStack spacing={6} align="stretch">
                {/* Points Card */}
                {profile && <PointsCard profile={profile} />}

                {/* Badge Grid */}
                <BadgeGrid badges={badges} userBadges={userBadges} />

                {/* Quick Stats */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                  <StatCard
                    label="Total Points"
                    value={profile?.totalPoints.toLocaleString() || '0'}
                    icon="💎"
                    bg={cardBg}
                    borderColor={borderColor}
                  />
                  <StatCard
                    label="Current Level"
                    value={`Level ${profile?.level || 1}`}
                    icon="⭐"
                    bg={cardBg}
                    borderColor={borderColor}
                  />
                  <StatCard
                    label="Badges Earned"
                    value={`${userBadges.length}/${badges.length}`}
                    icon="🏅"
                    bg={cardBg}
                    borderColor={borderColor}
                  />
                  <StatCard
                    label="Rank"
                    value={profile?.rank || 'Novice'}
                    icon="🎖️"
                    bg={cardBg}
                    borderColor={borderColor}
                  />
                </SimpleGrid>
              </VStack>
            </TabPanel>

            {/* Leaderboard Tab */}
            <TabPanel px={0}>
              <LeaderboardTable
                entries={leaderboard}
                period={leaderboardPeriod}
                onPeriodChange={handlePeriodChange}
                currentUserId={MOCK_USER_ID}
              />
            </TabPanel>

            {/* Training Courses Tab */}
            <TabPanel px={0}>
              <Box
                bg={cardBg}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="xl"
                p={8}
                textAlign="center"
              >
                <VStack spacing={4}>
                  <Text fontSize="6xl">📚</Text>
                  <Heading size="md">Training Courses</Heading>
                  <Text color="gray.500" maxW="md">
                    Access our comprehensive training library to enhance your caregiving skills
                    and earn points towards your next level.
                  </Text>
                  <HStack spacing={4}>
                    <Button
                      as={Link}
                      href="https://training.medi-aide.com"
                      target="_blank"
                      colorScheme="purple"
                      size="lg"
                    >
                      Go to Training Platform
                    </Button>
                    <Button variant="outline" colorScheme="purple" size="lg">
                      View Certificates
                    </Button>
                  </HStack>
                </VStack>
              </Box>

              {/* Featured Courses */}
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mt={6}>
                <CourseCard
                  title="Dementia Care Fundamentals"
                  duration="4 hours"
                  points={100}
                  bg={cardBg}
                  borderColor={borderColor}
                />
                <CourseCard
                  title="Medication Management"
                  duration="2 hours"
                  points={50}
                  bg={cardBg}
                  borderColor={borderColor}
                />
                <CourseCard
                  title="First Aid & CPR Refresher"
                  duration="3 hours"
                  points={75}
                  bg={cardBg}
                  borderColor={borderColor}
                />
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Box>
  );
}

// Helper Components
function StatCard({
  label,
  value,
  icon,
  bg,
  borderColor,
}: {
  label: string;
  value: string;
  icon: string;
  bg: string;
  borderColor: string;
}) {
  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      textAlign="center"
    >
      <Text fontSize="2xl" mb={1}>
        {icon}
      </Text>
      <Text fontSize="xl" fontWeight="bold">
        {value}
      </Text>
      <Text fontSize="sm" color="gray.500">
        {label}
      </Text>
    </Box>
  );
}

function CourseCard({
  title,
  duration,
  points,
  bg,
  borderColor,
}: {
  title: string;
  duration: string;
  points: number;
  bg: string;
  borderColor: string;
}) {
  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={5}
      _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
      transition="all 0.2s"
    >
      <VStack align="stretch" spacing={3}>
        <Heading size="sm">{title}</Heading>
        <HStack justify="space-between" fontSize="sm" color="gray.500">
          <Text>⏱️ {duration}</Text>
          <Text>💎 +{points} pts</Text>
        </HStack>
        <Button size="sm" colorScheme="purple" variant="outline">
          Start Course
        </Button>
      </VStack>
    </Box>
  );
}
