'use client';

import * as React from 'react';
import { 
  Box, 
  Card, 
  CardBody, 
  CardHeader,
  Heading,
  Text, 
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Progress,
  Badge,
  useColorModeValue
} from '@chakra-ui/react';

export interface HeartRateData {
  current: number;
  average: number;
  min: number;
  max: number;
  trend: 'increase' | 'decrease' | 'stable';
  lastUpdated: Date;
}

interface HeartRateMonitorProps {
  data?: HeartRateData;
  userId?: string;
}

export function HeartRateMonitor({ data, userId }: HeartRateMonitorProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Mock data for demo
  const heartRateData: HeartRateData = data || {
    current: 72,
    average: 68,
    min: 55,
    max: 95,
    trend: 'stable',
    lastUpdated: new Date()
  };

  const getZoneColor = (bpm: number) => {
    if (bpm < 60) return 'blue';
    if (bpm < 100) return 'green';
    if (bpm < 140) return 'yellow';
    return 'red';
  };

  const zone = getZoneColor(heartRateData.current);

  return (
    <Card bg={bgColor} borderColor={borderColor} borderWidth={1}>
      <CardHeader>
        <Heading size="md">Heart Rate Monitor</Heading>
        <Text fontSize="sm" color="gray.500">
          Package-based component (RSC-safe)
        </Text>
      </CardHeader>
      <CardBody>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Stat>
            <StatLabel>Current BPM</StatLabel>
            <StatNumber fontSize="3xl">
              {heartRateData.current}
            </StatNumber>
            <StatHelpText>
              <StatArrow 
                type={heartRateData.trend === 'increase' ? 'increase' : 'decrease'} 
              />
              {heartRateData.trend}
            </StatHelpText>
          </Stat>
          
          <Box>
            <Text fontSize="sm" mb={2}>Heart Rate Zone</Text>
            <Badge colorScheme={zone} fontSize="lg" p={2}>
              {zone === 'green' ? 'Normal' : 
               zone === 'blue' ? 'Low' :
               zone === 'yellow' ? 'Elevated' : 'High'}
            </Badge>
          </Box>
        </SimpleGrid>

        <Box mt={6}>
          <Text fontSize="sm" mb={2}>Daily Range</Text>
          <Progress 
            value={(heartRateData.current - heartRateData.min) / (heartRateData.max - heartRateData.min) * 100} 
            colorScheme={zone}
            size="sm"
          />
          <SimpleGrid columns={3} mt={2} fontSize="xs" color="gray.500">
            <Text>Min: {heartRateData.min}</Text>
            <Text textAlign="center">Avg: {heartRateData.average}</Text>
            <Text textAlign="right">Max: {heartRateData.max}</Text>
          </SimpleGrid>
        </Box>

        <Text fontSize="xs" color="gray.400" mt={4}>
          Last updated: {heartRateData.lastUpdated.toLocaleTimeString()}
        </Text>
      </CardBody>
    </Card>
  );
}
