import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabaseFleetRepository } from '../services/supabaseRepository';
import { AnalysisRecord } from '../types';
import { formatCurrency, getFuelTypeLabel } from '../utils/formatters';
import { CostComparisonChart } from '../components/charts/CostComparisonChart';
import { useAuth } from '../contexts/AuthContext';

export const HistoryScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 세부 모달
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);

  const loadAnalyses = useCallback(async () => {
    setErrorMessage(null);
    try {
      if (!user) {
        setAnalyses([]);
        setLoading(false);
        return;
      }
      const list = await supabaseFleetRepository.getAnalyses();
      setAnalyses(list);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '분석 이력을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    loadAnalyses();
  }, [loadAnalyses]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalyses();
  };

  const handleDelete = (id: string) => {
    Alert.alert('분석 삭제', '이 분석 스냅샷을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabaseFleetRepository.deleteAnalysis(id);
            loadAnalyses();
          } catch (err: any) {
            Alert.alert('삭제 실패', err.message);
          }
        },
      },
    ]);
  };

  const handleCloneAndReanalyze = (record: AnalysisRecord) => {
    setSelectedRecord(null);
    // 경제성 분석 탭으로 이동하며 clonedInput 전달
    navigation.navigate('Analysis', { clonedInput: record.input_snapshot });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>분석 이력을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />}
      >
        {errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#B91C1C" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.headerTitle}>저장된 경제성 분석 스냅샷 ({analyses.length}건)</Text>
          <Text style={styles.headerSub}>
            저장 당시의 입력값과 결과가 보존되며, 복제하여 조건 재분석이 가능합니다.
          </Text>
        </View>

        {analyses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>저장된 분석 이력이 없습니다.</Text>
            <Text style={styles.emptySub}>
              [경제성 비교] 탭에서 분석을 진행한 후 [분석 결과 스냅샷 저장]을 눌러보세요.
            </Text>
          </View>
        ) : (
          analyses.map((item) => {
            const inp = item.input_snapshot;
            const res = item.result_snapshot;
            const isReplace = res.recommended_alternative === 'replace';

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.recordCard}
                onPress={() => setSelectedRecord(item)}
                activeOpacity={0.8}
              >
                <View style={styles.recordTop}>
                  <Text style={styles.recordTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#E11D48" />
                  </TouchableOpacity>
                </View>

                <View style={styles.compareRow}>
                  <Text style={styles.vehName} numberOfLines={1}>
                    {inp.existing.plate_number} ({getFuelTypeLabel(inp.existing.fuel_type)})
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color="#94A3B8" />
                  <Text style={[styles.vehName, { color: '#0D9488' }]} numberOfLines={1}>
                    {inp.replacement.model_name.split('(')[0]}
                  </Text>
                </View>

                <View style={styles.recordBottom}>
                  <View
                    style={[
                      styles.recPill,
                      isReplace ? styles.recPillReplace : styles.recPillKeep,
                    ]}
                  >
                    <Text
                      style={[
                        styles.recPillText,
                        isReplace ? styles.recTextReplace : styles.recTextKeep,
                      ]}
                    >
                      {isReplace ? '신차 교체 유리' : '기존 유지 유리'}
                    </Text>
                  </View>
                  <Text style={styles.savingsText}>
                    {formatCurrency(res.savings_amount)} 절감
                  </Text>
                  <Text style={styles.dateText}>
                    {item.created_at.split('T')[0]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* 분석 상세 조회 모달 */}
      <Modal visible={!!selectedRecord} animationType="slide" transparent onRequestClose={() => setSelectedRecord(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedRecord?.title}
                </Text>
                <Text style={styles.modalSub}>
                  저장일시: {selectedRecord?.created_at.replace('T', ' ').substring(0, 19)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedRecord(null)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {selectedRecord && (
              <ScrollView contentContainerStyle={styles.detailScroll}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>기본 전제 조건</Text>
                  <View style={styles.detailGrid}>
                    <Text style={styles.detailItem}>
                      분석 기간: {selectedRecord.input_snapshot.analysis_period_years}년
                    </Text>
                    <Text style={styles.detailItem}>
                      연간 주행거리: {selectedRecord.input_snapshot.annual_distance_km.toLocaleString()}km
                    </Text>
                    <Text style={styles.detailItem}>
                      할인율: {selectedRecord.input_snapshot.discount_rate_pct}%
                    </Text>
                  </View>
                </View>

                {/* 차트 */}
                <CostComparisonChart result={selectedRecord.result_snapshot} />

                {/* 대안별 세부 파라미터 */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>대안 1: 기존 차량 유지</Text>
                  <Text style={styles.detailSub}>
                    {selectedRecord.input_snapshot.existing.plate_number} (
                    {selectedRecord.input_snapshot.existing.model_name})
                  </Text>
                  <Text style={styles.detailSub}>
                    현재 매각가: {formatCurrency(selectedRecord.input_snapshot.existing.current_market_value)} | 실적연비:{' '}
                    {selectedRecord.input_snapshot.existing.efficiency}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>대안 2: 친환경 신차 교체</Text>
                  <Text style={styles.detailSub}>
                    {selectedRecord.input_snapshot.replacement.model_name}
                  </Text>
                  <Text style={styles.detailSub}>
                    차량가: {formatCurrency(selectedRecord.input_snapshot.replacement.purchase_price)} | 보조금:{' '}
                    {formatCurrency(selectedRecord.input_snapshot.replacement.subsidy)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.cloneButton}
                  onPress={() => handleCloneAndReanalyze(selectedRecord)}
                >
                  <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.cloneButtonText}>이 조건으로 복제 재분석</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#B91C1C',
    flex: 1,
  },
  header: {
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  recordTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehName: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    flexShrink: 1,
  },
  recordBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  recPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recPillReplace: {
    backgroundColor: '#CCFBF1',
  },
  recPillKeep: {
    backgroundColor: '#FEF3C7',
  },
  recPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  recTextReplace: {
    color: '#0F766E',
  },
  recTextKeep: {
    color: '#B45309',
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D9488',
  },
  dateText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  detailScroll: {
    gap: 12,
  },
  detailSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  detailItem: {
    fontSize: 11,
    color: '#64748B',
  },
  detailSub: {
    fontSize: 11,
    color: '#64748B',
  },
  cloneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 6,
  },
  cloneButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

