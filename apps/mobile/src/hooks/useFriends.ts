import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../state/auth';

export type Friendship = {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
};

export function useFriends() {
  const { session } = useAuth();
  const [friends, setFriends] = useState<string[]>([]);
  const [pendingSent, setPendingSent] = useState<string[]>([]);
  const [pendingReceived, setPendingReceived] = useState<string[]>([]);
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

      // Get friendships where user is either user_id or friend_id
      const { data, error: fetchError } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);

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
          if (friendship.user_id === session.user.id) {
            acceptedFriends.push(friendship.friend_id);
          } else {
            acceptedFriends.push(friendship.user_id);
          }
        } else if (friendship.status === 'pending') {
          // Separate sent vs received pending requests
          if (friendship.user_id === session.user.id) {
            sentPending.push(friendship.friend_id);
          } else {
            receivedPending.push(friendship.user_id);
          }
        }
      });

      setFriends(acceptedFriends);
      setPendingSent(sentPending);
      setPendingReceived(receivedPending);
      setLoading(false);
    };

    fetchFriendships();
  }, [session?.user?.id]);

  const sendFriendRequest = async (friendId: string) => {
    if (!session?.user?.id || !supabase) return false;

    const { error: insertError } = await supabase.from('friendships').insert({
      user_id: session.user.id,
      friend_id: friendId,
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
      .eq('user_id', userId)
      .eq('friend_id', session.user.id);

    if (updateError) {
      console.error('Failed to accept friend request:', updateError);
      return false;
    }

    // Update local state
    setPendingReceived((prev) => prev.filter((id) => id !== userId));
    setFriends((prev) => [...prev, userId]);
    return true;
  };

  return {
    friends,
    pendingSent,
    pendingReceived,
    loading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
  };
}
