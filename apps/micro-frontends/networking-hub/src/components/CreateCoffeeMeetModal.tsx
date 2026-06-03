import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
} from '@chakra-ui/react';
import { createCoffeeMeet, CommunityGroup } from '../lib/api';

interface CreateCoffeeMeetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  userId: string;
  groups?: CommunityGroup[];
}

export default function CreateCoffeeMeetModal({
  isOpen,
  onClose,
  onCreated,
  userId,
  groups = [],
}: CreateCoffeeMeetModalProps) {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [groupId, setGroupId] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async () => {
    if (!topic.trim()) {
      toast({ title: 'Topic is required', status: 'warning' });
      return;
    }
    if (!scheduledAt) {
      toast({ title: 'Schedule date/time is required', status: 'warning' });
      return;
    }

    setIsLoading(true);
    try {
      await createCoffeeMeet({
        topic: topic.trim(),
        description: description.trim() || undefined,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
        createdBy: userId,
        groupId: groupId || undefined,
        meetingUrl: meetingUrl.trim() || undefined,
        maxParticipants,
      });
      toast({ title: 'CoffeeMeet created!', status: 'success' });
      onCreated();
      onClose();
      // Reset form
      setTopic('');
      setDescription('');
      setScheduledAt('');
      setDurationMinutes(30);
      setMaxParticipants(4);
      setGroupId('');
      setMeetingUrl('');
    } catch (err) {
      toast({ title: 'Failed to create CoffeeMeet', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Schedule a CoffeeMeet ☕</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Topic</FormLabel>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Best practices for dementia care"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will you discuss?"
                rows={2}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Date & Time</FormLabel>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Duration (minutes)</FormLabel>
              <NumberInput
                value={durationMinutes}
                onChange={(_, val) => setDurationMinutes(val || 30)}
                min={15}
                max={180}
                step={15}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Max Participants</FormLabel>
              <NumberInput
                value={maxParticipants}
                onChange={(_, val) => setMaxParticipants(val || 4)}
                min={2}
                max={12}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            {groups.length > 0 && (
              <FormControl>
                <FormLabel>Group (optional)</FormLabel>
                <Select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  placeholder="Select a group"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl>
              <FormLabel>Meeting URL (optional)</FormLabel>
              <Input
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://meet.google.com/..."
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="teal" onClick={handleSubmit} isLoading={isLoading}>
            Schedule CoffeeMeet
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

