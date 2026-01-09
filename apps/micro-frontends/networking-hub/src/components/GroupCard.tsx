import {
  Box,
  Badge,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { CommunityGroup } from '../lib/api';

interface GroupCardProps {
  group: CommunityGroup;
  onJoin?: (groupId: string) => void;
  onView?: (groupId: string) => void;
  isMember?: boolean;
}

const categoryColors: Record<string, string> = {
  wellness: 'green',
  mentorship: 'purple',
  specialty: 'blue',
  location: 'orange',
  training: 'teal',
  general: 'gray',
  family: 'pink',
};

export default function GroupCard({ group, onJoin, onView, isMember }: GroupCardProps) {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={5}
      shadow="sm"
      _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
      transition="all 0.2s"
    >
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <Heading size="sm" noOfLines={1}>
            {group.name}
          </Heading>
          <Badge colorScheme={categoryColors[group.category] || 'gray'}>
            {group.category}
          </Badge>
        </HStack>

        {group.description && (
          <Text fontSize="sm" color="gray.500" noOfLines={2}>
            {group.description}
          </Text>
        )}

        <HStack justify="space-between" fontSize="xs" color="gray.400">
          <Text>{group.memberCount} members</Text>
          {group.isPrivate && <Badge size="sm">Private</Badge>}
        </HStack>

        <HStack spacing={2} mt={2}>
          <Button
            size="sm"
            colorScheme="blue"
            variant="outline"
            onClick={() => onView?.(group.id)}
            flex={1}
          >
            View
          </Button>
          {!isMember && (
            <Button
              size="sm"
              colorScheme="teal"
              onClick={() => onJoin?.(group.id)}
              flex={1}
            >
              Join
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
}

