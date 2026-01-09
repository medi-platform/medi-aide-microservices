import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Button,
  HStack,
  VStack,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  useDisclosure,
  useColorModeValue,
  Select,
  InputGroup,
  InputLeftElement,
  Input,
} from '@chakra-ui/react';
import {
  listGroups,
  listCoffeeMeets,
  joinGroup,
  joinCoffeeMeet,
  CommunityGroup,
  CoffeeMeet,
} from '../lib/api';
import GroupCard from './GroupCard';
import CoffeeMeetCard from './CoffeeMeetCard';
import CreateGroupModal from './CreateGroupModal';
import CreateCoffeeMeetModal from './CreateCoffeeMeetModal';

// Mock user ID - in production this would come from auth context
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function NetworkingDashboard() {
  // State
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [coffeeMeets, setCoffeeMeets] = useState<CoffeeMeet[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingMeets, setIsLoadingMeets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const {
    isOpen: isGroupModalOpen,
    onOpen: onGroupModalOpen,
    onClose: onGroupModalClose,
  } = useDisclosure();
  const {
    isOpen: isCoffeeMeetModalOpen,
    onOpen: onCoffeeMeetModalOpen,
    onClose: onCoffeeMeetModalClose,
  } = useDisclosure();

  // Colors
  const bgGradient = useColorModeValue(
    'linear(to-br, teal.50, blue.50)',
    'linear(to-br, gray.900, gray.800)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    setIsLoadingGroups(true);
    try {
      const result = await listGroups({
        category: categoryFilter || undefined,
        limit: 20,
      });
      setGroups(result.data);
      setError(null);
    } catch (err) {
      setError('Failed to load groups. Please try again.');
    } finally {
      setIsLoadingGroups(false);
    }
  }, [categoryFilter]);

  // Fetch coffee meets
  const fetchCoffeeMeets = useCallback(async () => {
    setIsLoadingMeets(true);
    try {
      const result = await listCoffeeMeets({
        status: 'scheduled',
        limit: 20,
      });
      setCoffeeMeets(result.data);
    } catch (err) {
      // Don't overwrite group errors
    } finally {
      setIsLoadingMeets(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchCoffeeMeets();
  }, [fetchGroups, fetchCoffeeMeets]);

  // Handlers
  const handleJoinGroup = async (groupId: string) => {
    try {
      await joinGroup(groupId, MOCK_USER_ID);
      fetchGroups();
    } catch (err) {
      setError('Failed to join group');
    }
  };

  const handleJoinCoffeeMeet = async (meetId: string) => {
    try {
      await joinCoffeeMeet(meetId, MOCK_USER_ID);
      fetchCoffeeMeets();
    } catch (err) {
      setError('Failed to join CoffeeMeet');
    }
  };

  // Filter groups by search
  const filteredGroups = groups.filter(
    (g) =>
      !searchQuery ||
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      <Container maxW="container.xl" py={8}>
        {/* Header */}
        <VStack spacing={2} mb={8} align="flex-start">
          <Heading size="xl" bgGradient="linear(to-r, teal.500, blue.500)" bgClip="text">
            Networking Hub
          </Heading>
          <Text color="gray.500">
            Connect with caregivers, join groups, and participate in CoffeeMeets.
          </Text>
        </VStack>

        {error && (
          <Alert status="error" mb={4} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Tabs colorScheme="teal" variant="enclosed">
          <TabList>
            <Tab>🏠 Groups ({groups.length})</Tab>
            <Tab>☕ CoffeeMeets ({coffeeMeets.length})</Tab>
          </TabList>

          <TabPanels>
            {/* Groups Tab */}
            <TabPanel px={0}>
              <VStack spacing={4} align="stretch">
                {/* Filters and Actions */}
                <HStack justify="space-between" flexWrap="wrap" gap={4}>
                  <HStack flex={1} minW="300px">
                    <InputGroup maxW="300px">
                      <InputLeftElement pointerEvents="none">🔍</InputLeftElement>
                      <Input
                        placeholder="Search groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        bg={cardBg}
                      />
                    </InputGroup>
                    <Select
                      maxW="200px"
                      placeholder="All Categories"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      bg={cardBg}
                    >
                      <option value="wellness">Wellness</option>
                      <option value="mentorship">Mentorship</option>
                      <option value="specialty">Specialty</option>
                      <option value="location">Location</option>
                      <option value="training">Training</option>
                      <option value="family">Family</option>
                      <option value="general">General</option>
                    </Select>
                  </HStack>
                  <Button colorScheme="teal" onClick={onGroupModalOpen}>
                    + Create Group
                  </Button>
                </HStack>

                {/* Groups Grid */}
                {isLoadingGroups ? (
                  <Center py={10}>
                    <Spinner size="xl" color="teal.500" />
                  </Center>
                ) : filteredGroups.length === 0 ? (
                  <Center py={10}>
                    <VStack spacing={4}>
                      <Text color="gray.500">No groups found.</Text>
                      <Button colorScheme="teal" onClick={onGroupModalOpen}>
                        Create the first group!
                      </Button>
                    </VStack>
                  </Center>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {filteredGroups.map((group) => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        onJoin={handleJoinGroup}
                        onView={(id) => console.log('View group', id)}
                      />
                    ))}
                  </SimpleGrid>
                )}
              </VStack>
            </TabPanel>

            {/* CoffeeMeets Tab */}
            <TabPanel px={0}>
              <VStack spacing={4} align="stretch">
                <HStack justify="flex-end">
                  <Button colorScheme="teal" onClick={onCoffeeMeetModalOpen}>
                    + Schedule CoffeeMeet
                  </Button>
                </HStack>

                {isLoadingMeets ? (
                  <Center py={10}>
                    <Spinner size="xl" color="teal.500" />
                  </Center>
                ) : coffeeMeets.length === 0 ? (
                  <Center py={10}>
                    <VStack spacing={4}>
                      <Text color="gray.500">No upcoming CoffeeMeets.</Text>
                      <Button colorScheme="teal" onClick={onCoffeeMeetModalOpen}>
                        Schedule the first one!
                      </Button>
                    </VStack>
                  </Center>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {coffeeMeets.map((meet) => (
                      <CoffeeMeetCard
                        key={meet.id}
                        meet={meet}
                        onJoin={handleJoinCoffeeMeet}
                        participantCount={1} // Would fetch real count
                      />
                    ))}
                  </SimpleGrid>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Modals */}
        <CreateGroupModal
          isOpen={isGroupModalOpen}
          onClose={onGroupModalClose}
          onCreated={fetchGroups}
          userId={MOCK_USER_ID}
        />
        <CreateCoffeeMeetModal
          isOpen={isCoffeeMeetModalOpen}
          onClose={onCoffeeMeetModalClose}
          onCreated={fetchCoffeeMeets}
          userId={MOCK_USER_ID}
          groups={groups}
        />
      </Container>
    </Box>
  );
}
