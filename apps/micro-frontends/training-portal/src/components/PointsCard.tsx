import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Progress,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { GamificationProfile } from '../lib/api';

interface PointsCardProps {
  profile: GamificationProfile;
}

export default function PointsCard({ profile }: PointsCardProps) {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Calculate progress to next level
  const currentLevelPoints = (profile.level - 1) ** 2 * 100;
  const nextLevelPoints = profile.level ** 2 * 100;
  const pointsInLevel = profile.totalPoints - currentLevelPoints;
  const pointsNeeded = nextLevelPoints - currentLevelPoints;
  const progress = (pointsInLevel / pointsNeeded) * 100;

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={6}
      shadow="lg"
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <VStack align="flex-start" spacing={0}>
            <Text fontSize="sm" color="gray.500">
              Total Points
            </Text>
            <Heading
              size="2xl"
              bgGradient="linear(to-r, purple.500, pink.500)"
              bgClip="text"
            >
              {profile.totalPoints.toLocaleString()}
            </Heading>
          </VStack>
          <VStack align="center" spacing={1}>
            <Badge
              colorScheme="purple"
              fontSize="lg"
              px={4}
              py={2}
              borderRadius="full"
            >
              Level {profile.level}
            </Badge>
            <Text fontSize="xs" color="gray.500">
              {profile.rank}
            </Text>
          </VStack>
        </HStack>

        <VStack align="stretch" spacing={1}>
          <HStack justify="space-between" fontSize="xs" color="gray.500">
            <Text>Progress to Level {profile.level + 1}</Text>
            <Text>
              {pointsInLevel.toLocaleString()} / {pointsNeeded.toLocaleString()}
            </Text>
          </HStack>
          <Progress
            value={progress}
            colorScheme="purple"
            borderRadius="full"
            size="sm"
            hasStripe
            isAnimated
          />
        </VStack>
      </VStack>
    </Box>
  );
}

