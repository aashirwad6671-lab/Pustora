import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { SupportService, FAQItem } from '../../src/services/supportService';

export default function SupportScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // States
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'faq' | 'tickets'>('faq');

  // Form States for creating a ticket
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialization Load
  useEffect(() => {
    setFaqs(SupportService.getFAQs());

    async function loadTickets() {
      const uid = user?.id || 'mock-user-id';
      setLoading(true);
      const response = await SupportService.getUserTickets(uid);
      if (response.data) {
        setTickets(response.data);
      }
      setLoading(false);
    }
    loadTickets();
  }, [user]);

  // Handle WhatsApp Support Trigger
  const handleWhatsAppSupport = async () => {
    const waUrl = SupportService.getWhatsAppURI();
    const supported = await Linking.canOpenURL(waUrl);
    
    if (supported) {
      await Linking.openURL(waUrl);
    } else {
      // Fallback web url launcher
      await Linking.openURL('https://api.whatsapp.com/send?phone=919999999999');
    }
  };

  // Handle Ticket Submission
  const handleCreateTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      setErrorMsg('Please enter a subject and details.');
      return;
    }

    setCreatingTicket(true);
    setErrorMsg(null);

    const uid = user?.id || 'mock-user-id';
    const response = await SupportService.createSupportTicket(uid, subject.trim(), description.trim(), priority);

    setCreatingTicket(false);
    if (response.error) {
      setErrorMsg(response.error);
    } else if (response.data) {
      setTickets([response.data, ...tickets]);
      setSubject('');
      setDescription('');
      alert('Support ticket created successfully!');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Help & Support</Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'faq' ? styles.tabActive : null]}
            onPress={() => setActiveTab('faq')}
          >
            <Text style={[styles.tabText, activeTab === 'faq' ? styles.tabTextActive : null]}>
              ❔ FAQs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tickets' ? styles.tabActive : null]}
            onPress={() => setActiveTab('tickets')}
          >
            <Text style={[styles.tabText, activeTab === 'tickets' ? styles.tabTextActive : null]}>
              💬 Tickets & Chat
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BODY WORKSPACE */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* WHATSAPP SUPPORT LAUNCHER CARD */}
        <TouchableOpacity style={styles.whatsappCard} onPress={handleWhatsAppSupport}>
          <Text style={styles.whatsappEmoji}>💬</Text>
          <View style={styles.whatsappDetails}>
            <Text style={styles.whatsappTitle}>Connect via WhatsApp</Text>
            <Text style={styles.whatsappSub}>Chat with Pustora support experts instantly</Text>
          </View>
          <Text style={styles.arrowIcon}>▶</Text>
        </TouchableOpacity>

        {/* -------------------- FAQ TAB CONTENT -------------------- */}
        {activeTab === 'faq' && (
          <View style={styles.faqSection}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            {faqs.map((faq, idx) => {
              const isExpanded = expandedFaqIndex === idx;
              return (
                <View key={idx} style={styles.faqItem}>
                  <TouchableOpacity
                    style={styles.faqHeader}
                    onPress={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                  >
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Text style={styles.faqArrow}>{isExpanded ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={styles.faqAnswerBox}>
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* -------------------- TICKETS & LIVE CHAT TAB CONTENT -------------------- */}
        {activeTab === 'tickets' && (
          <View style={styles.ticketsSection}>
            
            {/* Create Ticket Form */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create New Help Ticket</Text>
              {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
              
              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Ticket Subject (e.g. Broken compass box)"
                  placeholderTextColor="#8E8A94"
                  value={subject}
                  onChangeText={(val) => {
                    setSubject(val);
                    setErrorMsg(null);
                  }}
                  editable={!creatingTicket}
                />
                
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Describe your issue in details..."
                  placeholderTextColor="#8E8A94"
                  multiline={true}
                  numberOfLines={4}
                  value={description}
                  onChangeText={(val) => {
                    setDescription(val);
                    setErrorMsg(null);
                  }}
                  editable={!creatingTicket}
                />

                <View style={styles.priorityRow}>
                  <Text style={styles.priorityLabel}>Priority:</Text>
                  {(['low', 'medium', 'high'] as const).map((pri) => (
                    <TouchableOpacity
                      key={pri}
                      style={[
                        styles.priorityChip,
                        priority === pri ? styles.priorityChipActive : null,
                      ]}
                      onPress={() => setPriority(pri)}
                    >
                      <Text
                        style={[
                          styles.priorityChipText,
                          priority === pri ? styles.priorityChipTextActive : null,
                        ]}
                      >
                        {pri.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, creatingTicket ? styles.submitBtnDisabled : null]}
                  onPress={handleCreateTicket}
                  disabled={creatingTicket}
                >
                  {creatingTicket ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit Support Ticket</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Ticket Logs List */}
            <View style={styles.logsCard}>
              <Text style={styles.cardTitle}>Previous Help Requests ({tickets.length})</Text>
              {loading ? (
                <ActivityIndicator size="small" color="#5C2D91" />
              ) : tickets.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: '#8E8A94', marginTop: 10 }}>No support history recorded.</p>
              ) : (
                tickets.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.ticketItem}
                    onPress={() =>
                      router.push({
                        pathname: "/support/[ticketId]",
                        params: { ticketId: t.id, subject: t.subject },
                      })
                    }
                  >
                    <View style={styles.ticketHeader}>
                      <Text style={styles.ticketSubject} numberOfLines={1}>{t.subject}</Text>
                      <span
                        style={{
                          ...styles.ticketBadge,
                          backgroundColor: t.status === 'open' ? '#FEE2E2' : '#D1FAE5',
                          color: t.status === 'open' ? '#EF4444' : '#10B981',
                        }}
                      >
                        {t.status.toUpperCase()}
                      </span>
                    </View>
                    <Text style={styles.ticketDesc} numberOfLines={1}>{t.description}</Text>
                    <Text style={styles.ticketDate}>
                      Logged on: {new Date(t.created_at).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2DFE5',
    paddingVertical: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    fontSize: 16,
    color: '#5C2D91',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#440F79',
    fontFamily: 'Outfit-Bold',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  tab: {
    flex: 1,
    backgroundColor: '#F3F4F5',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: 'rgba(92, 45, 145, 0.05)',
    borderColor: '#5C2D91',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B4451',
    fontFamily: 'Nunito-Bold',
  },
  tabTextActive: {
    color: '#5C2D91',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  whatsappCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCF8C6',
    borderWidth: 1,
    borderColor: '#C7E5B4',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  whatsappEmoji: {
    fontSize: 24,
  },
  whatsappDetails: {
    flex: 1,
    gap: 2,
  },
  whatsappTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#128C7E',
    fontFamily: 'Outfit-Bold',
  },
  whatsappSub: {
    fontSize: 11,
    color: '#075E54',
    fontFamily: 'Nunito-Regular',
  },
  arrowIcon: {
    fontSize: 12,
    color: '#128C7E',
  },
  faqSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#440F79',
    fontFamily: 'Outfit-Bold',
    marginBottom: 4,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DFE5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1D',
    fontFamily: 'Nunito-Bold',
    lineHeight: 18,
  },
  faqArrow: {
    fontSize: 12,
    color: '#8E8A94',
    marginLeft: 10,
  },
  faqAnswerBox: {
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderColor: '#E2DFE5',
    padding: 14,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#4B4451',
    lineHeight: 19,
    fontFamily: 'Nunito-Regular',
  },
  ticketsSection: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DFE5',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#440F79',
    fontFamily: 'Outfit-Bold',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
  },
  form: {
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2DFE5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#191C1D',
    fontFamily: 'Nunito-Regular',
  },
  textarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  priorityLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8A94',
    fontFamily: 'Nunito-Bold',
  },
  priorityChip: {
    backgroundColor: '#F3F4F5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  priorityChipActive: {
    backgroundColor: 'rgba(92, 45, 145, 0.08)',
  },
  priorityChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E8A94',
  },
  priorityChipTextActive: {
    color: '#5C2D91',
  },
  submitBtn: {
    backgroundColor: '#5C2D91',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnDisabled: {
    backgroundColor: '#7E4BB8',
    opacity: 0.8,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit-Bold',
  },
  logsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DFE5',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  ticketItem: {
    borderBottomWidth: 1,
    borderColor: '#F3F4F5',
    paddingVertical: 12,
    gap: 4,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketSubject: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1D',
    marginRight: 10,
  },
  ticketBadge: {
    fontSize: 8,
    fontWeight: '800',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    overflow: 'hidden',
  },
  ticketDesc: {
    fontSize: 12,
    color: '#8E8A94',
    fontFamily: 'Nunito-Regular',
  },
  ticketDate: {
    fontSize: 10,
    color: '#8E8A94',
    marginTop: 2,
  },
});
