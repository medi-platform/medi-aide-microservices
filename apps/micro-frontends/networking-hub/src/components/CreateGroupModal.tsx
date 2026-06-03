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
  Switch,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { createGroup } from '../lib/api';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  userId: string;
}

const categories = [
  { value: 'general', label: 'General' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'specialty', label: 'Specialty' },
  { value: 'location', label: 'Location-based' },
  { value: 'training', label: 'Training' },
  { value: 'family', label: 'Family' },
];

export default function CreateGroupModal({ isOpen, onClose, onCreated, userId }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: 'Name is required', status: 'warning' });
      return;
    }

    setIsLoading(true);
    try {
      await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        isPrivate,
        createdBy: userId,
      });
      toast({ title: 'Group created!', status: 'success' });
      onCreated();
      onClose();
      setName('');
      setDescription('');
      setCategory('general');
      setIsPrivate(false);
    } catch (err) {
      toast({ title: 'Failed to create group', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create a Group</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Group Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Geriatric Care Specialists"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this group about?"
                rows={3}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Category</FormLabel>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>Private Group</FormLabel>
              <Switch isChecked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="teal" onClick={handleSubmit} isLoading={isLoading}>
            Create Group
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

