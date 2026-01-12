'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { Poll } from '@/types';
import { useAuth } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';

interface PollDisplayProps {
  pollId: string;
  postId: string;
}

export function PollDisplay({ pollId, postId }: PollDisplayProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Buscar enquete
  const { data: poll, isLoading } = useQuery<Poll>({
    queryKey: ['poll', pollId],
    queryFn: async () => {
      const response = await fetch(`/api/feed/poll/${pollId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch poll');
      }
      return response.json();
    },
  });

  // Mutation para votar
  const voteMutation = useMutation({
    mutationFn: async (optionIndex: number) => {
      const response = await fetch(`/api/feed/poll/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optionIndex }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to vote');
      }

      return response.json();
    },
    // Atualização otimista
    onMutate: async (optionIndex) => {
      if (!poll) return;

      // Cancelar queries pendentes
      await queryClient.cancelQueries({ queryKey: ['poll', pollId] });

      // Snapshot do estado anterior
      const previousPoll = poll;

      // Calcular novo estado otimista
      const newVoteCounts = [...poll.voteCounts];
      const previousVoteIndex = poll.userVote?.optionIndex;

      // Se já tinha votado, remover voto anterior
      if (previousVoteIndex !== undefined) {
        newVoteCounts[previousVoteIndex] = Math.max(0, newVoteCounts[previousVoteIndex] - 1);
      }

      // Adicionar novo voto
      newVoteCounts[optionIndex] = (newVoteCounts[optionIndex] || 0) + 1;

      const newTotalVotes = poll.totalVotes + (previousVoteIndex === undefined ? 1 : 0);

      // Atualizar cache otimisticamente
      queryClient.setQueryData(['poll', pollId], {
        ...poll,
        totalVotes: newTotalVotes,
        voteCounts: newVoteCounts,
        userVote: {
          optionIndex,
        },
      });

      return { previousPoll };
    },
    onError: (err, optionIndex, context) => {
      // Reverter em caso de erro
      if (context?.previousPoll) {
        queryClient.setQueryData(['poll', pollId], context.previousPoll);
      }
    },
    onSuccess: (data) => {
      // Atualizar com dados do servidor
      queryClient.setQueryData(['poll', pollId], data);
    },
  });

  const handleVote = (optionIndex: number) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    voteMutation.mutate(optionIndex);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!poll) {
    return null;
  }

  const totalVotes = poll.totalVotes || 0;
  const hasVoted = poll.userVote !== undefined;

  return (
    <div className="my-4 p-4 border rounded-lg bg-muted/30">
      <h3 className="font-semibold text-lg mb-4">{poll.question}</h3>
      
      <div className="space-y-3">
        {poll.options.map((option, index) => {
          const voteCount = poll.voteCounts[index] || 0;
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          const isVoted = poll.userVote?.optionIndex === index;

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  {hasVoted ? (
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 text-left hover:bg-muted"
                      disabled
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={isVoted ? 'font-semibold' : ''}>{option}</span>
                          <span className="text-sm text-muted-foreground">
                            {voteCount} {voteCount === 1 ? 'voto' : 'votos'} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto p-3 text-left"
                      onClick={() => handleVote(index)}
                      disabled={voteMutation.isPending}
                    >
                      {option}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalVotes > 0 && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          {totalVotes} {totalVotes === 1 ? 'voto total' : 'votos totais'}
        </p>
      )}
    </div>
  );
}

