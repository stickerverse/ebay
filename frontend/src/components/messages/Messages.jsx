import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import MessagesList from './MessagesList';
import MessageFilters from './MessageFilters';
import { messageAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Messages = () => {
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    search: '',
    page: 1
  });

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    ['messages', filters],
    () => messageAPI.getMessages(filters),
    {
      keepPreviousData: true,
      refetchInterval: 30000
    }
  );

  const respondMutation = useMutation(
    ({ messageId, responseText }) => messageAPI.respond(messageId, responseText),
    {
      onSuccess: () => {
        toast.success('Response sent successfully');
        queryClient.invalidateQueries('messages');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to send response');
      }
    }
  );

  const syncMutation = useMutation(
    () => messageAPI.sync(),
    {
      onSuccess: (data) => {
        toast.success(`Synced ${data.newMessages} new messages`);
        queryClient.invalidateQueries('messages');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Sync failed');
      }
    }
  );

  const handleRespond = (messageId, responseText) => {
    respondMutation.mutate({ messageId, responseText });
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading messages: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isLoading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Sync Messages
        </button>
      </div>

      <MessageFilters
        filters={filters}
        onChange={handleFilterChange}
        totalMessages={data?.totalMessages || 0}
      />

      <MessagesList
        messages={data?.messages || []}
        isLoading={isLoading}
        onRespond={handleRespond}
        onPageChange={handlePageChange}
        currentPage={filters.page}
        totalPages={data?.totalPages || 1}
        respondingMessageId={respondMutation.isLoading ? respondMutation.variables?.messageId : null}
      />
    </div>
  );
};

export default Messages;
