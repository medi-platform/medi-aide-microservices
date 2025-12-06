'use client';

import * as React from 'react';
import { Box, Skeleton, SkeletonCircle, SkeletonText, SimpleGrid, Card, CardBody } from '@chakra-ui/react';

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Box>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} mb={4}>
          <Skeleton height="20px" mb={2} />
          <Skeleton height="14px" width="60%" />
        </Box>
      ))}
    </Box>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardBody>
            <Skeleton height="24px" mb={3} />
            <SkeletonText mt="4" noOfLines={4} spacing="3" skeletonHeight="2" />
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  );
}

export function ProfileSkeleton() {
  return (
    <Box>
      <SkeletonCircle size="16" />
      <Skeleton height="18px" mt={3} width="50%" />
      <Skeleton height="14px" mt={2} width="30%" />
    </Box>
  );
}
