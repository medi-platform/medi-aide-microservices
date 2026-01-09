import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  Text,
  Select,
  useColorModeValue,
} from '@chakra-ui/react';
import { LeaderboardEntry } from '../lib/api';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  period: 'weekly' | 'monthly' | 'alltime';
  onPeriodChange: (period: 'weekly' | 'monthly' | 'alltime') => void;
  currentUserId?: string;
}

const rankEmojis: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export default function LeaderboardTable({
  entries,
  period,
  onPeriodChange,
  currentUserId,
}: LeaderboardTableProps) {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const highlightBg = useColorModeValue('purple.50', 'purple.900');

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={6}
      overflowX="auto"
    >
      <HStack justify="space-between" mb={4}>
        <Text fontSize="lg" fontWeight="bold">
          🏆 Leaderboard
        </Text>
        <Select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as any)}
          maxW="150px"
          size="sm"
        >
          <option value="alltime">All Time</option>
          <option value="monthly">This Month</option>
          <option value="weekly">This Week</option>
        </Select>
      </HStack>

      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th w="60px">Rank</Th>
            <Th>Caregiver</Th>
            <Th isNumeric>Points</Th>
            <Th isNumeric>Level</Th>
          </Tr>
        </Thead>
        <Tbody>
          {entries.map((entry) => (
            <Tr
              key={entry.userId}
              bg={entry.userId === currentUserId ? highlightBg : undefined}
              fontWeight={entry.userId === currentUserId ? 'bold' : undefined}
            >
              <Td>
                <HStack spacing={1}>
                  <Text fontSize="lg">{rankEmojis[entry.rank] || ''}</Text>
                  <Text>{entry.rank}</Text>
                </HStack>
              </Td>
              <Td>
                <HStack spacing={2}>
                  <Text>Caregiver #{entry.userId.slice(0, 8)}</Text>
                  {entry.userId === currentUserId && (
                    <Badge colorScheme="purple" size="sm">
                      You
                    </Badge>
                  )}
                </HStack>
              </Td>
              <Td isNumeric>{entry.totalPoints.toLocaleString()}</Td>
              <Td isNumeric>
                <Badge colorScheme="blue">Lv.{entry.level}</Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {entries.length === 0 && (
        <Text color="gray.500" textAlign="center" py={4}>
          No leaderboard data yet. Start earning points!
        </Text>
      )}
    </Box>
  );
}

