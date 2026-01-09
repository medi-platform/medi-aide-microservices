import {
  Box,
  Badge,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { CoffeeMeet } from '../lib/api';

interface CoffeeMeetCardProps {
  meet: CoffeeMeet;
  onJoin?: (meetId: string) => void;
  participantCount?: number;
}

export default function CoffeeMeetCard({ meet, onJoin, participantCount = 0 }: CoffeeMeetCardProps) {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const scheduledDate = new Date(meet.scheduledAt);
  const isUpcoming = scheduledDate > new Date();
  const isFull = participantCount >= meet.maxParticipants;

  const statusColor = meet.status === 'scheduled' ? 'green' : meet.status === 'cancelled' ? 'red' : 'gray';

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
            ☕ {meet.topic}
          </Heading>
          <Badge colorScheme={statusColor}>{meet.status}</Badge>
        </HStack>

        {meet.description && (
          <Text fontSize="sm" color="gray.500" noOfLines={2}>
            {meet.description}
          </Text>
        )}

        <VStack align="stretch" spacing={1} fontSize="sm">
          <HStack justify="space-between">
            <Text color="gray.500">📅 {scheduledDate.toLocaleDateString()}</Text>
            <Text color="gray.500">🕐 {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text color="gray.500">⏱️ {meet.durationMinutes} min</Text>
            <Text color="gray.500">
              👥 {participantCount}/{meet.maxParticipants}
            </Text>
          </HStack>
        </VStack>

        {isUpcoming && meet.status === 'scheduled' && (
          <Button
            size="sm"
            colorScheme="teal"
            onClick={() => onJoin?.(meet.id)}
            isDisabled={isFull}
          >
            {isFull ? 'Full' : 'Join CoffeeMeet'}
          </Button>
        )}

        {meet.meetingUrl && meet.status === 'scheduled' && (
          <Button
            as="a"
            href={meet.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            colorScheme="blue"
            variant="outline"
          >
            Join Call
          </Button>
        )}
      </VStack>
    </Box>
  );
}

