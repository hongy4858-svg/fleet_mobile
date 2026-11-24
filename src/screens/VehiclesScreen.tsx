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
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabaseFleetRepository } from '../services/supabaseRepository';
import { Vehicle, FuelType } from '../types';
import { VehicleDeletionCheck } from '../services/repository';
import { formatCurrency, getEfficiencyUnit, getFuelTypeLabel } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';

export const VehiclesScreen: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 모달 제어 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // 폼 입력 필드
  const [plateNumber, setPlateNumber] = useState('');
  const [modelName, setModelName] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>('gasoline');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchasePrice, setPurchasePrice] = useState('35000000');
  const [officialEfficiency, setOfficialEfficiency] = useState('12.0');
  const [memo, setMemo] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 삭제 확인 모달
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [deletionCheck, setDeletionCheck] = useState<VehicleDeletionCheck | null>(null);
  const [checkingDelete, setCheckingDelete] = useState(false);

  const loadVehicles = useCallback(async () => {
    setErrorMessage(null);
    try {
      if (!user) {
        setVehicles([]);
        setLoading(false);
        return;
      }
      const list = await supabaseFleetRepository.getVehicles();
      setVehicles(list);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '차량 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    loadVehicles();
  }, [loadVehicles]);

  const onRefresh = () => {
    setRefreshing(true);
    loadVehicles();
  };

  const handleOpenAddModal = () => {
    setModalMode('create');
    setEditingId(null);
    setPlateNumber('');
    setModelName('');
    setFuelType('gasoline');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPurchasePrice('35000000');
    setOfficialEfficiency('12.0');
    setMemo('');
    setFormError(null);
    setModalVisible(true);
  };

  const handleOpenEditModal = (v: Vehicle) => {
    setModalMode('edit');
    setEditingId(v.id);
    setPlateNumber(v.plate_number);
    setModelName(v.model_name);
    setFuelType(v.fuel_type);
    setPurchaseDate(v.purchase_date);
    setPurchasePrice(String(v.purchase_price));
    setOfficialEfficiency(String(v.official_efficiency));
    setMemo(v.memo || '');
    setFormError(null);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!plateNumber.trim()) {
      setFormError('차량번호를 입력해 주세요.');
      return;
    }
    if (!modelName.trim()) {
      setFormError('모델명을 입력해 주세요.');
      return;
    }
    const priceNum = parseInt(purchasePrice, 10);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('구매가격을 올바르게 입력해 주세요.');
      return;
    }
    const effNum = parseFloat(officialEfficiency);
    if (isNaN(effNum) || effNum <= 0) {
      setFormError('공인연비를 0보다 큰 수로 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await supabaseFleetRepository.createVehicle({
          plate_number: plateNumber.trim(),
          model_name: modelName.trim(),
          fuel_type: fuelType,
          purchase_date: purchaseDate.trim(),
          purchase_price: priceNum,
          official_efficiency: effNum,
          memo: memo.trim(),
          owner_id: user?.id || '',
        });
      } else if (editingId) {
        await supabaseFleetRepository.updateVehicle(editingId, {
          plate_number: plateNumber.trim(),
          model_name: modelName.trim(),
          fuel_type: fuelType,
          purchase_date: purchaseDate.trim(),
          purchase_price: priceNum,
          official_efficiency: effNum,
          memo: memo.trim(),
        });
      }
      setModalVisible(false);
      loadVehicles();
    } catch (err: any) {
      setFormError(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartDelete = async (v: Vehicle) => {
    setDeletingVehicle(v);
    setCheckingDelete(true);
    setDeleteModalVisible(true);
    try {
      const check = await supabaseFleetRepository.checkVehicleDeletion(v.id);
      setDeletionCheck(check);
    } catch (err: any) {
      console.error(err);
      Alert.alert('삭제 검사 실패', err.message);
      setDeleteModalVisible(false);
    } finally {
      setCheckingDelete(false);
    }
  };

  const handleConfirmDelete = async (cascade: boolean) => {
    if (!deletingVehicle) return;
    try {
      await supabaseFleetRepository.deleteVehicle(deletingVehicle.id, cascade);
      setDeleteModalVisible(false);
      setDeletingVehicle(null);
      loadVehicles();
    } catch (err: any) {
      Alert.alert('삭제 오류', err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>보유 차량 목록을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />}
      >
        {/* 에러 배너 */}
        {errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#B91C1C" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* 상단 액션 바 */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topTitle}>보유 차량 목록 ({vehicles.length}대)</Text>
            <Text style={styles.topSub}>플릿에 등록된 차량을 관리하고 신규 차량을 등록합니다.</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleOpenAddModal}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>차량 등록</Text>
          </TouchableOpacity>
        </View>

        {vehicles.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="car-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>등록된 차량이 없습니다</Text>
            <Text style={styles.emptySub}>
              상단 [차량 등록] 버튼을 눌러 첫 차량을 등록하거나 시연 데이터를 생성해 보세요.
            </Text>
          </View>
        ) : (
          vehicles.map((v) => (
            <View key={v.id} style={styles.vehicleCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.plate}>{v.plate_number}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{getFuelTypeLabel(v.fuel_type)}</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleOpenEditModal(v)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="pencil" size={16} color="#0D9488" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleStartDelete(v)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#E11D48" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.modelName}>{v.model_name}</Text>

              <View style={styles.specsGrid}>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>공인 연비</Text>
                  <Text style={styles.specVal}>
                    {v.official_efficiency} {getEfficiencyUnit(v.fuel_type)}
                  </Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>구매 가격</Text>
                  <Text style={styles.specVal}>{formatCurrency(v.purchase_price)}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>구매 일자</Text>
                  <Text style={styles.specVal}>{v.purchase_date}</Text>
                </View>
              </View>

              {v.memo ? <Text style={styles.memoText}>비고: {v.memo}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>

      {/* 차량 등록/수정 모달 */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? '새 차량 등록' : '차량 정보 수정'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {formError && (
              <View style={styles.modalError}>
                <Ionicons name="alert-circle" size={16} color="#B91C1C" />
                <Text style={styles.modalErrorText}>{formError}</Text>
              </View>
            )}

            <ScrollView contentContainerStyle={styles.formContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>차량 번호</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="예: 12가 3456"
                  placeholderTextColor="#94A3B8"
                  value={plateNumber}
                  onChangeText={setPlateNumber}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>차량 모델명</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="예: 그랜저 2.5 가솔린"
                  placeholderTextColor="#94A3B8"
                  value={modelName}
                  onChangeText={setModelName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>연료 유형</Text>
                <View style={styles.fuelTypeRow}>
                  {(['gasoline', 'diesel', 'hybrid', 'electric', 'hydrogen'] as FuelType[]).map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[styles.fuelChip, fuelType === f && styles.fuelChipActive]}
                      onPress={() => setFuelType(f)}
                    >
                      <Text style={[styles.fuelChipText, fuelType === f && styles.fuelChipTextActive]}>
                        {getFuelTypeLabel(f)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>구매 일자 (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="2022-01-15"
                  placeholderTextColor="#94A3B8"
                  value={purchaseDate}
                  onChangeText={setPurchaseDate}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>구매 가격 (원)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="35000000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>공인 연비 ({getEfficiencyUnit(fuelType)})</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="12.0"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={officialEfficiency}
                  onChangeText={setOfficialEfficiency}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>메모 / 비고</Text>
                <TextInput
                  style={[styles.textInput, { height: 60 }]}
                  placeholder="임원용, 순환 영업용 등 메모"
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={memo}
                  onChangeText={setMemo}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>저장하기</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 차량 삭제 확인 및 연쇄 삭제 모달 */}
      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteCard}>
            <View style={styles.deleteHeader}>
              <Ionicons name="warning" size={24} color="#E11D48" />
              <Text style={styles.deleteTitle}>차량 삭제 확인</Text>
            </View>

            {checkingDelete ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator color="#E11D48" />
                <Text style={{ marginTop: 8, fontSize: 12, color: '#64748B' }}>연관 데이터 확인 중...</Text>
              </View>
            ) : deletionCheck ? (
              <View style={styles.deleteBody}>
                <Text style={styles.deleteDesc}>
                  차량 <Text style={{ fontWeight: '800', color: '#0F172A' }}>{deletingVehicle?.plate_number}</Text> ({deletingVehicle?.model_name})을(를) 삭제하시겠습니까?
                </Text>

                {deletionCheck.totalRelatedCount > 0 ? (
                  <View style={styles.relatedWarningBox}>
                    <Text style={styles.relatedWarningTitle}>
                      연관된 운영 데이터가 {deletionCheck.totalRelatedCount}건 존재합니다:
                    </Text>
                    <Text style={styles.relatedItem}>• 운행 기록: {deletionCheck.tripCount}건</Text>
                    <Text style={styles.relatedItem}>• 주유/충전 기록: {deletionCheck.energyCount}건</Text>
                    <Text style={styles.relatedItem}>• 정비 기록: {deletionCheck.maintCount}건</Text>
                    <Text style={styles.relatedItem}>• 분석 이력: {deletionCheck.analysisCount}건</Text>
                    <Text style={styles.cascadeNotice}>
                      * 차량 삭제 시 연관된 모든 기록이 함께 연쇄 삭제(Cascade)됩니다.
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.safeDeleteText}>연관된 운영 기록이 없어 즉시 안전하게 삭제됩니다.</Text>
                )}

                <View style={styles.deleteActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmDeleteBtn}
                    onPress={() => handleConfirmDelete(deletionCheck.totalRelatedCount > 0)}
                  >
                    <Text style={styles.confirmDeleteBtnText}>
                      {deletionCheck.totalRelatedCount > 0 ? '연관 데이터 포함 삭제' : '차량 삭제'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
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
    gap: 14,
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  topSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plate: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    padding: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modelName: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  specsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    justifyContent: 'space-between',
  },
  specItem: {
    alignItems: 'center',
    flex: 1,
  },
  specLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 2,
  },
  specVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  memoText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  modalErrorText: {
    fontSize: 11,
    color: '#B91C1C',
    flex: 1,
  },
  formContent: {
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  fuelTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  fuelChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  fuelChipActive: {
    backgroundColor: '#0D9488',
  },
  fuelChipText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  fuelChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#0D9488',
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  deleteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E11D48',
  },
  deleteBody: {
    gap: 10,
  },
  deleteDesc: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  relatedWarningBox: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  relatedWarningTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BE123C',
    marginBottom: 2,
  },
  relatedItem: {
    fontSize: 11,
    color: '#E11D48',
  },
  cascadeNotice: {
    fontSize: 10,
    color: '#881337',
    marginTop: 6,
  },
  safeDeleteText: {
    fontSize: 12,
    color: '#059669',
  },
  deleteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  confirmDeleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#E11D48',
  },
  confirmDeleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

