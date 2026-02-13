import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
};

export type PendingFriend = {
  id: string;
  full_name: string | null;
};

export function useFriends() {
  const { session } = useAuth();
  const [friends, setFriends] = useState<string[]>([]);
  const [pendingSent, setPendingSent] = useState<string[]>([]);
  const [pendingReceived, setPendingReceived] = useState<string[]>([]);
  const [pendingReceivedUsers, setPendingReceivedUsers] = useState<PendingFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id || !supabase) {
      setLoading(false);
      return;
    }

    const fetchFriendships = async () => {
      setLoading(true);
      setError(null);

      if (!supabase) return;

      // Get friendships where user is either requester or addressee
      const { data, error: fetchError } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${session.user.id},addressee_id.eq.${session.user.id}`);

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const acceptedFriends: string[] = [];
      const sentPending: string[] = [];
      const receivedPending: string[] = [];

      data?.forEach((friendship) => {
        if (friendship.status === 'accepted') {
          // Add the other user as friend
          if (friendship.requester_id === session.user.id) {
            acceptedFriends.push(friendship.addressee_id);
          } else {
            acceptedFriends.push(friendship.requester_id);
          }
        } else if (friendship.status === 'pending') {
          // Separate sent vs received pending requests
          if (friendship.requester_id === session.user.id) {
            sentPending.push(friendship.addressee_id);
          } else {
            receivedPending.push(friendship.requester_id);
          }
        }
      });

      setFriends(acceptedFriends);
      setPendingSent(sentPending);
      setPendingReceived(receivedPending);

      if (receivedPending.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', receivedPending);

        const resolvedProfiles = profiles?.map((profile) => ({
          id: profile.id,
          full_name: profile.full_name,
        })) || [];

        setPendingReceivedUsers(resolvedProfiles);
      } else {
        setPendingReceivedUsers([]);
      }
      setLoading(false);
    };

    fetchFriendships();
  }, [session?.user?.id]);

  const sendFriendRequest = async (friendId: string) => {
    if (!session?.user?.id || !supabase) return false;

    const { error: insertError } = await supabase.from('friendships').insert({
      requester_id: session.user.id,
      addressee_id: friendId,
      status: 'pending',
    });

    if (insertError) {
      console.error('Failed to send friend request:', insertError);
      return false;
    }

    // Update local state
    setPendingSent((prev) => [...prev, friendId]);
    return true;
  };

  const acceptFriendRequest = async (userId: string) => {
    if (!session?.user?.id || !supabase) return false;

    const { error: updateError } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('requester_id', userId)
      .eq('addressee_id', session.user.id);

    if (updateError) {
      console.error('Failed to accept friend request:', updateError);
      return false;
    }

    // Update local state
    setPendingReceived((prev) => prev.filter((id) => id !== userId));
    setPendingReceivedUsers((prev) => prev.filter((item) => item.id !== userId));
    setFriends((prev) => [...prev, userId]);
    return true;
  };

  const rejectFriendRequest = async (userId: string) => {
    if (!session?.user?.id || !supabase) return false;

    const { error: updateError } = await supabase
      .from('friendships')
      .update({ status: 'rejected' })
      .eq('requester_id', userId)
      .eq('addressee_id', session.user.id);

    if (updateError) {
      console.error('Failed to reject friend request:', updateError);
      return false;
    }

    setPendingReceived((prev) => prev.filter((id) => id !== userId));
    setPendingReceivedUsers((prev) => prev.filter((item) => item.id !== userId));
    return true;
  };

  return {
    friends,
    pendingSent,
    pendingReceived,
    pendingReceivedUsers,
    loading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  };
}
