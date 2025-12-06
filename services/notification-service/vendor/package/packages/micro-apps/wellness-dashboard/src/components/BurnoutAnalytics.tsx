'use client';

import * as React from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  CircularProgress,
  CircularProgressLabel,
  SimpleGrid,
  List,
  ListItem,
  Badge,
  useColorModeValue,
  VStack,
  HStack
} from '@chakra-ui/react';
// Icons removed for zero-dependency package

export interface BurnoutMetrics {
  overallScore: number; // 0-100
  categories: {
    workload: number;
    emotionalExhaustion: number;
    personalAchievement: number;
    depersonalization: number;
  };
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendations: string[];
}

interface BurnoutAnalyticsProps {
  metrics?: BurnoutMetrics;
  userId?: string;
  showRecommendations?: boolean;
}

export function BurnoutAnalytics({ 
  metrics, 
  userId,
  showRecommendations = true 
}: BurnoutAnalyticsProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Mock data for demo
  const burnoutData: BurnoutMetrics = metrics || {
    overallScore: 35,
    categories: {
      workload: 65,
      emotionalExhaustion: 45,
      personalAchievement: 75,
      depersonalization: 25
    },
    riskLevel: 'moderate',
    recommendations: [
      'Take regular breaks throughout your shift',
      'Practice mindfulness exercises daily',
      'Connect with colleagues for support',
      'Maintain work-life boundaries'
    ]
  };

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'low': return 'green';
      case 'moderate': return 'yellow';
      case 'high': return 'orange';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'green.400';
    if (score >= 40) return 'yellow.400';
    return 'red.400';
  };

  return (
    <Card bg={bgColor} borderColor={borderColor} borderWidth={1}>
      <CardHeader>
        <HStack justify="space-between">
          <Heading size="md">Burnout Risk Analysis</Heading>
          <Badge 
            colorScheme={getRiskColor(burnoutData.riskLevel)}
            fontSize="sm"
            px={3}
            py={1}
          >
            {burnoutData.riskLevel.toUpperCase()} RISK
          </Badge>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Overall Score */}
          <Box textAlign="center">
            <CircularProgress 
              value={burnoutData.overallScore} 
              size="120px"
              thickness="8px"
              color={getScoreColor(burnoutData.overallScore)}
            >
              <CircularProgressLabel fontSize="2xl" fontWeight="bold">
                {burnoutData.overallScore}%
              </CircularProgressLabel>
            </CircularProgress>
            <Text mt={2} fontSize="sm" color="gray.500">
              Overall Wellness Score
            </Text>
          </Box>

          {/* Category Breakdown */}
          <SimpleGrid columns={2} spacing={4}>
            {Object.entries(burnoutData.categories).map(([category, score]) => (
              <Box key={category}>
                <Text fontSize="sm" mb={1} textTransform="capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </Text>
                <Box bg="gray.100" borderRadius="full" overflow="hidden">
                  <Box
                    bg={getScoreColor(score)}
                    h="8px"
                    w={`${score}%`}
                    transition="width 0.3s"
                  />
                </Box>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {score}%
                </Text>
              </Box>
            ))}
          </SimpleGrid>

          {/* Recommendations */}
          {showRecommendations && burnoutData.recommendations.length > 0 && (
            <Box>
              <Text fontWeight="semibold" mb={2}>
                Personalized Recommendations
              </Text>
              <List spacing={2}>
                {burnoutData.recommendations.map((rec, index) => (
                <ListItem key={index} fontSize="sm">
                  <Text as="span" mr={2} color={getRiskColor(burnoutData.riskLevel) + '.500'}>
                    •
                  </Text>
                  {rec}
                </ListItem>
                ))}
              </List>
            </Box>
          )}
        </VStack>

        <Text fontSize="xs" color="gray.400" mt={6}>
          Analysis based on recent activity patterns
        </Text>
      </CardBody>
    </Card>
  );
}
