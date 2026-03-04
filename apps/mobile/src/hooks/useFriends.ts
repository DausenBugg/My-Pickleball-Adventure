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

  const refresh = async () => {
    if (!session?.user?.id || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

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

  useEffect(() => {
    refresh();
  }, [session?.user?.id]);

  const sendFriendRequest = async (friendId: string) => {
    if (!session?.user?.id || !supabase) return false;

    const { error: insertError } = await supabase.from('friendships').insert({
      requester_id: session.user.id,
      addressee_id: friendId,
      status: 'pending',
    });

    if (insertError) {
      if (__DEV__) console.error('Failed to send friend request:', insertError);
      return false;
    }

    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.user.id)
      .single();

    const requesterName = requesterProfile?.full_name || 'Someone';

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: friendId,
        type: 'friend_request',
        title: 'New friend request',
        message: `${requesterName} wants to add you as a friend.`,
        data: { requester_id: session.user.id },
      });

    if (notificationError && __DEV__) {
      console.error('Failed to create friend request notification:', notificationError);
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
      if (__DEV__) console.error('Failed to accept friend request:', updateError);
      return false;
    }

    // Trigger achievement check for both users (friend milestones)
    try {
      if (supabase) {
        await supabase.functions.invoke('check-achievements', {
          body: { userId: session.user.id },
        });
        await supabase.functions.invoke('check-achievements', {
          body: { userId },
        });
      }
    } catch (achError) {
      if (__DEV__) console.error('Failed to check friend achievements:', achError);
    }

    // Update local state
    setPendingReceived((prev) => prev.filter((id) => id !== userId));
    setPendingReceivedUsers((prev) => prev.filter((item) => item.id !== userId));
    setFriends((prev) => [...prev, userId]);
    return true;
  };

  const rejectFriendRequest = async (userId: string) => {
    if (!session?.user?.id || !supabase) return false;

    // Delete the friendship record so the user can send another request later
    const { error: deleteError } = await supabase
      .from('friendships')
      .delete()
      .eq('requester_id', userId)
      .eq('addressee_id', session.user.id);

    if (deleteError) {
      if (__DEV__) console.error('Failed to reject friend request:', deleteError);
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
    refresh,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  };
}
