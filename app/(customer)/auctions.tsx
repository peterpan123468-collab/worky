import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Auction, AuctionBid, AuctionService } from '@/lib/auction-service';
import { shadowPresets } from '@/utils/shadows';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

export default function CustomerAuctions() {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadAuctions();
    
    // Set up real-time subscription for auctions
    const subscription = AuctionService.subscribeToActiveAuctions(() => {
      loadAuctions();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadAuctions = async () => {
    try {
      const activeAuctions = await AuctionService.getActiveAuctions();
      setAuctions(activeAuctions);
    } catch (error) {
      console.error('Error loading auctions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinAuction = (auction: Auction) => {
    setSelectedAuction(auction);
    setShowBidModal(true);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const renderAuction = ({ item }: { item: Auction }) => {
    const { date, time } = formatDateTime(item.time_slots?.start_time || '');
    const timeRemaining = AuctionService.getTimeRemaining(item.end_time);
    
    return (
      <View style={[styles.auctionCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.auctionHeader}>
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={styles.businessName}>
              🔥 {item.time_slots?.users?.handyman_profiles?.business_name}
            </ThemedText>
            <ThemedText style={styles.location}>
              📍 {item.time_slots?.users?.handyman_profiles?.location}
            </ThemedText>
          </View>
          <View style={[styles.auctionBadge, { backgroundColor: '#FF6B35' }]}>
            <ThemedText style={styles.auctionText}>AUCTION</ThemedText>
          </View>
        </View>

        <View style={styles.auctionDetails}>
          <ThemedText style={styles.dateTime}>
            📅 {date} at {time}
          </ThemedText>
          <ThemedText style={styles.duration}>
            ⏱️ Duration: {item.time_slots?.duration} hour{item.time_slots?.duration !== 1 ? 's' : ''}
          </ThemedText>
        </View>

        <View style={styles.biddingInfo}>
          <View style={styles.priceContainer}>
            <ThemedText style={styles.startingPrice}>
              Starting: ${item.starting_price.toFixed(2)}
            </ThemedText>
            <ThemedText style={styles.currentBid}>
              Current Bid: ${item.current_bid.toFixed(2)}
            </ThemedText>
          </View>
          
          <View style={styles.timeContainer}>
            {timeRemaining.isExpired ? (
              <ThemedText style={[styles.timeRemaining, { color: '#F44336' }]}>
                ⏰ Ended
              </ThemedText>
            ) : (
              <ThemedText style={[styles.timeRemaining, { color: '#FF6B35' }]}>
                ⏰ {timeRemaining.minutes}:{timeRemaining.seconds.toString().padStart(2, '0')} left
              </ThemedText>
            )}
          </View>
        </View>

        {!timeRemaining.isExpired && (
          <Pressable
            style={[styles.joinButton, { backgroundColor: '#FF6B35' }]}
            onPress={() => handleJoinAuction(item)}
          >
            <ThemedText style={styles.joinButtonText}>
              Place Bid
            </ThemedText>
          </Pressable>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading auctions...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          🔥 Active Auctions
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Bid on high-demand time slots
        </ThemedText>
      </View>

      <FlatList
        data={auctions}
        renderItem={renderAuction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={loadAuctions}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              No active auctions
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Auctions start when multiple customers want the same time slot
            </ThemedText>
          </View>
        )}
      />

      {selectedAuction && (
        <BiddingModal
          visible={showBidModal}
          auction={selectedAuction}
          onClose={() => {
            setShowBidModal(false);
            setSelectedAuction(null);
          }}
          onBidPlaced={loadAuctions}
        />
      )}
    </ThemedView>
  );
}

// Bidding Modal Component
interface BiddingModalProps {
  visible: boolean;
  auction: Auction;
  onClose: () => void;
  onBidPlaced: () => void;
}

function BiddingModal({ visible, auction, onClose, onBidPlaced }: BiddingModalProps) {
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState('');
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(AuctionService.getTimeRemaining(auction.end_time));
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (visible) {
      loadAuctionDetails();
      
      // Set up timer
      const timer = setInterval(() => {
        const remaining = AuctionService.getTimeRemaining(auction.end_time);
        setTimeRemaining(remaining);
        
        if (remaining.isExpired) {
          clearInterval(timer);
          onClose();
        }
      }, 1000);

      // Set up real-time subscription
      const subscription = AuctionService.subscribeToAuction(auction.id, () => {
        loadAuctionDetails();
      });

      return () => {
        clearInterval(timer);
        subscription.unsubscribe();
      };
    }
  }, [visible, auction.id]);

  const loadAuctionDetails = async () => {
    const { bids: auctionBids } = await AuctionService.getAuctionDetails(auction.id);
    setBids(auctionBids);
  };

  const handlePlaceBid = async () => {
    if (!user || !bidAmount) return;

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= auction.current_bid) {
      Alert.alert('Invalid Bid', `Bid must be higher than current bid of $${auction.current_bid.toFixed(2)}`);
      return;
    }

    setIsLoading(true);
    const { success, error } = await AuctionService.placeBid(auction.id, user.id, amount);
    setIsLoading(false);

    if (success) {
      setBidAmount('');
      onBidPlaced();
      Alert.alert('Bid Placed!', `Your bid of $${amount.toFixed(2)} has been placed.`);
    } else {
      Alert.alert('Bid Failed', error || 'Failed to place bid');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      accessible={true}
      accessibilityViewIsModal={true}
      supportedOrientations={['portrait', 'landscape']}
      statusBarTranslucent={false}
    >
      <ThemedView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <ThemedText type="title" style={styles.modalTitle}>
            🔥 Auction Details
          </ThemedText>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <ThemedText style={[styles.closeButtonText, { color: Colors[colorScheme ?? 'light'].tint }]}>
              Close
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.auctionInfo}>
            <ThemedText type="defaultSemiBold" style={styles.businessName}>
              {auction.handyman_profiles?.business_name}
            </ThemedText>
            <ThemedText style={styles.timeRemaining}>
              ⏰ {timeRemaining.minutes}:{timeRemaining.seconds.toString().padStart(2, '0')} remaining
            </ThemedText>
            <ThemedText style={styles.currentBidLarge}>
              Current Bid: ${auction.current_bid.toFixed(2)}
            </ThemedText>
          </View>

          <View style={styles.bidSection}>
            <ThemedText style={styles.bidLabel}>Your Bid ($)</ThemedText>
            <TextInput
              style={[
                styles.bidInput,
                { 
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                  borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                  color: Colors[colorScheme ?? 'light'].text,
                }
              ]}
              value={bidAmount}
              onChangeText={setBidAmount}
              placeholder={`Minimum: $${(auction.current_bid + 1).toFixed(2)}`}
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              keyboardType="decimal-pad"
            />
            
            <Pressable
              style={[
                styles.bidButton,
                { backgroundColor: '#FF6B35' },
                (isLoading || timeRemaining.isExpired) && styles.buttonDisabled
              ]}
              onPress={handlePlaceBid}
              disabled={isLoading || timeRemaining.isExpired}
            >
              <ThemedText style={styles.bidButtonText}>
                {isLoading ? 'Placing Bid...' : 'Place Bid'}
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.bidsSection}>
            <ThemedText type="subtitle" style={styles.bidsTitle}>
              Current Bids ({bids.length})
            </ThemedText>
            <FlatList
              data={bids}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <View style={styles.bidItem}>
                  <ThemedText style={styles.bidRank}>
                    #{index + 1}
                  </ThemedText>
                  <ThemedText style={styles.bidUserEmail}>
                    {item.users?.email === user?.email ? 'You' : '***'}
                  </ThemedText>
                  <ThemedText style={styles.bidItemAmount}>
                    ${item.bid_amount.toFixed(2)}
                  </ThemedText>
                </View>
              )}
              style={styles.bidsList}
              ListEmptyComponent={() => (
                <ThemedText style={styles.noBids}>No bids yet</ThemedText>
              )}
            />
          </View>
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  auctionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    ...shadowPresets.medium,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  auctionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessName: {
    fontSize: 18,
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    opacity: 0.7,
  },
  auctionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  auctionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  auctionDetails: {
    marginBottom: 12,
    gap: 4,
  },
  dateTime: {
    fontSize: 14,
  },
  duration: {
    fontSize: 14,
    opacity: 0.8,
  },
  biddingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceContainer: {
    flex: 1,
  },
  startingPrice: {
    fontSize: 14,
    opacity: 0.7,
  },
  currentBid: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timeRemaining: {
    fontSize: 14,
    fontWeight: '600',
  },
  joinButton: {
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  modalTitle: {
    fontSize: 20,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  auctionInfo: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 16,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
  },
  currentBidLarge: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FF6B35',
    marginTop: 8,
  },
  bidSection: {
    marginBottom: 30,
  },
  bidLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  bidInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    marginBottom: 16,
  },
  bidButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  bidButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bidsSection: {
    flex: 1,
  },
  bidsTitle: {
    marginBottom: 12,
  },
  bidsList: {
    flex: 1,
  },
  bidItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  bidRank: {
    fontSize: 14,
    fontWeight: '600',
    width: 30,
  },
  bidUserEmail: {
    flex: 1,
    fontSize: 14,
  },
  bidItemAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  noBids: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
    paddingVertical: 20,
  },
});