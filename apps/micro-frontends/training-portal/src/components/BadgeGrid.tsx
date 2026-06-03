import {
  Box,
  SimpleGrid,
  VStack,
  Text,
  Image,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { BadgeDefinition, UserBadge } from '../lib/api';

interface BadgeGridProps {
  badges: BadgeDefinition[];
  userBadges: UserBadge[];
}

export default function BadgeGrid({ badges, userBadges }: BadgeGridProps) {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={6}
    >
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        🏅 Badges ({userBadges.length}/{badges.length})
      </Text>
      <SimpleGrid columns={{ base: 4, md: 6, lg: 8 }} spacing={4}>
        {badges.map((badge) => {
          const isEarned = earnedBadgeIds.has(badge.id);
          return (
            <Tooltip
              key={badge.id}
              label={
                <VStack spacing={1} p={2}>
                  <Text fontWeight="bold">{badge.name}</Text>
                  {badge.description && <Text fontSize="xs">{badge.description}</Text>}
                  {!isEarned && <Text fontSize="xs" color="yellow.300">Not yet earned</Text>}
                </VStack>
              }
              hasArrow
            >
              <VStack
                spacing={1}
                opacity={isEarned ? 1 : 0.3}
                filter={isEarned ? 'none' : 'grayscale(100%)'}
                cursor="pointer"
                _hover={{ transform: 'scale(1.1)' }}
                transition="all 0.2s"
              >
                {badge.iconUrl ? (
                  <Image
                    src={badge.iconUrl}
                    alt={badge.name}
                    boxSize="48px"
                    borderRadius="md"
                  />
                ) : (
                  <Box
                    boxSize="48px"
                    borderRadius="md"
                    bg="purple.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="2xl"
                  >
                    🏆
                  </Box>
                )}
                <Text fontSize="xs" textAlign="center" noOfLines={1}>
                  {badge.name}
                </Text>
              </VStack>
            </Tooltip>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}

