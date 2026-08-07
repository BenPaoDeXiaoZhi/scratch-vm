export interface MessageDescriptor {
  id: string;
  default: string;
  description?: string;
}

/**
 * This is a hook for extracting messages from extension source files.
 * This function simply returns the message descriptor map object that's passed in.
 * @param {object.<MessageDescriptor>} messages - the messages to be defined
 * @return {object.<MessageDescriptor>} - the input, unprocessed
 */
const defineMessages = function (
  messages: Record<string, MessageDescriptor>,
): Record<string, MessageDescriptor> {
  return messages;
};

export default defineMessages;
