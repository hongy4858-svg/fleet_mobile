import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Vehicle, TripLog, EnergyLog, MaintenanceLog } from '../types';
import {
  formatCurrency,
  formatDistance,
  getFuelTypeLabel,
  getFuelUnit,
} from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';

type LogTab = 'trips' | 'energy' | 'maintenance';

export const LogsScreen: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<LogTab>('trips');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<TripLog[]>([]);
  const [energy, setEnergy] = useState<EnergyLog[]>([]);
  const [maint, setMaint] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 모달 제어
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // 공통 선택 차량
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formMemo, setFormMemo] = useState('');

  // 운행 기록 필드
  const [distanceKm, setDistanceKm] = useState('150');

  // 주유·충전 필드
  const [energyAmount, setEnergyAmount] = useState('45');
  const [energyTotalCost, setEnergyTotalCost] = useState('76500');
  const [energyUnitPrice, setEnergyUnitPrice] = useState('1700');

  // 정비 필드
  const [maintItemName, setMaintItemName] = useState('엔진오일 및 에어컨 필터 교환');
  const [maintCost, setMaintCost] = useState('120000');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setErrorMessage(null);
    try {
      if (!user) {
        setVehicles([]);
        setTrips([]);
        setEnergy([]);
        setMaint([]);
        setLoading(false);
        return;
      }
      const [vList, tList, eList, mList] = await Promise.all([
        supabaseFleetRepository.getVehicles(),
        supabaseFleetRepository.getTripLogs(),
        supabaseFleetRepository.getEnergyLogs(),
        supabaseFleetRepository.getMaintenanceLogs(),
      ]);
      setVehicles(vList);
      setTrips(tList);
      setEnergy(eList);
      setMaint(mList);

      if (vList.length > 0 && !formVehicleId) {
        setFormVehicleId(vList[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '기록 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, formVehicleId]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const vehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>();
    vehicles.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles]);

  const selectedVehicleObj = useMemo(() => {
    return vehicleMap.get(formVehicleId) || vehicles[0];
  }, [vehicleMap, formVehicleId, vehicles]);

  // 필터링된 목록
  const filteredTrips = useMemo(() => {
    return selectedVehicleId === 'all'
      ? trips
      : trips.filter((t) => t.vehicle_id === selectedVehicleId);
  }, [trips, selectedVehicleId]);

  const filteredEnergy = useMemo(() => {
    return selectedVehicleId === 'all'
      ? energy
      : energy.filter((e) => e.vehicle_id === selectedVehicleId);
  }, [energy, selectedVehicleId]);

  const filteredMaint = useMemo(() => {
    return selectedVehicleId === 'all'
      ? maint
      : maint.filter((m) => m.vehicle_id === selectedVehicleId);
  }, [maint, selectedVehicleId]);

  const handleOpenAddModal = () => {
    if (vehicles.length === 0) {
      Alert.alert('알림', '먼저 차량을 등록하거나 시연 데이터를 생성해 주세요.');
      return;
    }
    setModalMode('create');
    setEditingId(null);
    setFormVehicleId(selectedVehicleId !== 'all' ? selectedVehicleId : vehicles[0].id);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormMemo('');
    setDistanceKm('150');
    setEnergyAmount('45');
    setEnergyTotalCost('76500');
    setEnergyUnitPrice('1700');
    setMaintItemName('정기 점검 및 소모품 교체');
    setMaintCost('120000');
    setFormError(null);
    setModalVisible(true);
  };

  const handleOpenEditModal = (item: any) => {
    setModalMode('edit');
    setEditingId(item.id);
    setFormVehicleId(item.vehicle_id);
    setFormMemo(item.memo || '');
    setFormError(null);

    if (activeTab === 'trips') {
      setFormDate(item.trip_date);
      setDistanceKm(String(item.distance_km));
    } else if (activeTab === 'energy') {
      setFormDate(item.log_date);
      setEnergyAmount(String(item.amount));
      setEnergyTotalCost(String(item.total_cost));
      setEnergyUnitPrice(String(item.unit_price));
    } else {
      setFormDate(item.maintenance_date);
      setMaintItemName(item.item_name);
      setMaintCost(String(item.cost));
    }

    setModalVisible(true);
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!formVehicleId) {
      setFormError('대상 차량을 선택해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      if (activeTab === 'trips') {
        const dist = parseFloat(distanceKm);
        if (isNaN(dist) || dist <= 0) {
          setFormError('주행거리를 0보다 큰 수로 입력해 주세요.');
          setSubmitting(false);
          return;
        }
        if (modalMode === 'create') {
          await supabaseFleetRepository.createTripLog({
            vehicle_id: formVehicleId,
            trip_date: formDate,
            distance_km: dist,
            memo: formMemo.trim(),
            owner_id: user?.id || '',
          });
        } else if (editingId) {
          await supabaseFleetRepository.updateTripLog(editingId, {
            vehicle_id: formVehicleId,
            trip_date: formDate,
            distance_km: dist,
            memo: formMemo.trim(),
          });
        }
      } else if (activeTab === 'energy') {
        const amt = parseFloat(energyAmount);
        const cost = parseInt(energyTotalCost, 10);
        const unit = parseInt(energyUnitPrice, 10);
        if (isNaN(amt) || amt <= 0 || isNaN(cost) || cost < 0) {
          setFormError('주유/충전량 및 결제금액을 올바르게 입력해 주세요.');
          setSubmitting(false);
          return;
        }
        if (modalMode === 'create') {
          await supabaseFleetRepository.createEnergyLog({
            vehicle_id: formVehicleId,
            log_date: formDate,
            amount: amt,
            total_cost: cost,
            unit_price: unit || (amt > 0 ? Math.round(cost / amt) : 0),
            memo: formMemo.trim(),
            owner_id: user?.id || '',
          });
        } else if (editingId) {
          await supabaseFleetRepository.updateEnergyLog(editingId, {
            vehicle_id: formVehicleId,
            log_date: formDate,
            amount: amt,
            total_cost: cost,
            unit_price: unit,
            memo: formMemo.trim(),
          });
        }
      } else {
        const cost = parseInt(maintCost, 10);
        if (!maintItemName.trim() || isNaN(cost) || cost < 0) {
          setFormError('정비 항목명과 정비 비용을 입력해 주세요.');
          setSubmitting(false);
          return;
        }
        if (modalMode === 'create') {
          await supabaseFleetRepository.createMaintenanceLog({
            vehicle_id: formVehicleId,
            maintenance_date: formDate,
            item_name: maintItemName.trim(),
            cost,
            memo: formMemo.trim(),
            owner_id: user?.id || '',
          });
        } else if (editingId) {
          await supabaseFleetRepository.updateMaintenanceLog(editingId, {
            vehicle_id: formVehicleId,
            maintenance_date: formDate,
            item_name: maintItemName.trim(),
            cost,
            memo: formMemo.trim(),
          });
        }
      }

      setModalVisible(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('기록 삭제', '정말 이 기록을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            if (activeTab === 'trips') await supabaseFleetRepository.deleteTripLog(id);
            else if (activeTab === 'energy') await supabaseFleetRepository.deleteEnergyLog(id);
            else await supabaseFleetRepository.deleteMaintenanceLog(id);
            loadData();
          } catch (err: any) {
            Alert.alert('삭제 오류', err.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>운행 및 비용 데이터를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 3대 상단 탭 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'trips' && styles.tabButtonActive]}
          onPress={() => setActiveTab('trips')}
        >
          <Ionicons
            name="speedometer-outline"
            size={16}
            color={activeTab === 'trips' ? '#0D9488' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'trips' && styles.tabTextActive]}>
            운행 ({trips.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'energy' && styles.tabButtonActive]}
          onPress={() => setActiveTab('energy')}
        >
          <Ionicons
            name="flame-outline"
            size={16}
            color={activeTab === 'energy' ? '#0D9488' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'energy' && styles.tabTextActive]}>
            주유·충전 ({energy.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'maintenance' && styles.tabButtonActive]}
          onPress={() => setActiveTab('maintenance')}
        >
          <Ionicons
            name="construct-outline"
            size={16}
            color={activeTab === 'maintenance' ? '#0D9488' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'maintenance' && styles.tabTextActive]}>
            정비 ({maint.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 차량 필터 및 추가 버튼 */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
          <TouchableOpacity
            style={[styles.filterChip, selectedVehicleId === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedVehicleId('all')}
          >
            <Text style={[styles.filterChipText, selectedVehicleId === 'all' && styles.filterChipTextActive]}>
              전체 차량
            </Text>
          </TouchableOpacity>
          {vehicles.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={[styles.filterChip, selectedVehicleId === v.id && styles.filterChipActive]}
              onPress={() => setSelectedVehicleId(v.id)}
            >
              <Text style={[styles.filterChipText, selectedVehicleId === v.id && styles.filterChipTextActive]}>
                {v.plate_number}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddModal}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>기록 등록</Text>
        </TouchableOpacity>
      </View>

      {/* 데이터 리스트 */}
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

        {/* 운행 기록 탭 */}
        {activeTab === 'trips' &&
          (filteredTrips.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>등록된 운행 기록이 없습니다.</Text>
            </View>
          ) : (
            filteredTrips.map((t) => {
              const v = vehicleMap.get(t.vehicle_id);
              return (
                <View key={t.id} style={styles.logCard}>
                  <View style={styles.cardTop}>
                    <View style={styles.plateTag}>
                      <Text style={styles.plateText}>{v?.plate_number || t.vehicle_id}</Text>
                      <Text style={styles.modelSub}>{v?.model_name.split('(')[0]}</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <TouchableOpacity onPress={() => handleOpenEditModal(t)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="pencil" size={15} color="#0D9488" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(t.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="trash-outline" size={15} color="#E11D48" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.mainStat}>{formatDistance(t.distance_km)}</Text>
                    <Text style={styles.dateText}>{t.trip_date}</Text>
                  </View>

                  {t.memo ? <Text style={styles.memoText}>{t.memo}</Text> : null}
                </View>
              );
            })
          ))}

        {/* 주유·충전 기록 탭 */}
        {activeTab === 'energy' &&
          (filteredEnergy.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>등록된 주유·충전 기록이 없습니다.</Text>
            </View>
          ) : (
            filteredEnergy.map((e) => {
              const v = vehicleMap.get(e.vehicle_id);
              const unit = getFuelUnit(v?.fuel_type || 'gasoline');
              return (
                <View key={e.id} style={styles.logCard}>
                  <View style={styles.cardTop}>
                    <View style={styles.plateTag}>
                      <Text style={styles.plateText}>{v?.plate_number || e.vehicle_id}</Text>
                      <Text style={styles.modelSub}>
                        {getFuelTypeLabel(v?.fuel_type || 'gasoline')}
                      </Text>
                    </View>
                    <View style={styles.actionRow}>
                      <TouchableOpacity onPress={() => handleOpenEditModal(e)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="pencil" size={15} color="#0D9488" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(e.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="trash-outline" size={15} color="#E11D48" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View>
                      <Text style={styles.mainStat}>{formatCurrency(e.total_cost)}</Text>
                      <Text style={styles.subStat}>
                        {e.amount} {unit} ({Math.round(e.unit_price).toLocaleString()}원/{unit})
                      </Text>
                    </View>
                    <Text style={styles.dateText}>{e.log_date}</Text>
                  </View>

                  {e.memo ? <Text style={styles.memoText}>{e.memo}</Text> : null}
                </View>
              );
            })
          ))}

        {/* 정비 기록 탭 */}
        {activeTab === 'maintenance' &&
          (filteredMaint.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>등록된 정비 기록이 없습니다.</Text>
            </View>
          ) : (
            filteredMaint.map((m) => {
              const v = vehicleMap.get(m.vehicle_id);
              return (
                <View key={m.id} style={styles.logCard}>
                  <View style={styles.cardTop}>
                    <View style={styles.plateTag}>
                      <Text style={styles.plateText}>{v?.plate_number || m.vehicle_id}</Text>
                      <Text style={styles.modelSub}>{v?.model_name.split('(')[0]}</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <TouchableOpacity onPress={() => handleOpenEditModal(m)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="pencil" size={15} color="#0D9488" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(m.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="trash-outline" size={15} color="#E11D48" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.maintItemName}>{m.item_name}</Text>

                  <View style={styles.cardBody}>
                    <Text style={styles.mainStat}>{formatCurrency(m.cost)}</Text>
                    <Text style={styles.dateText}>{m.maintenance_date}</Text>
                  </View>

                  {m.memo ? <Text style={styles.memoText}>{m.memo}</Text> : null}
                </View>
              );
            })
          ))}
      </ScrollView>

      {/* 등록/수정 모달 */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeTab === 'trips' ? '운행 기록' : activeTab === 'energy' ? '주유·충전 기록' : '정비 기록'}{' '}
                {modalMode === 'create' ? '등록' : '수정'}
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
                <Text style={styles.inputLabel}>대상 차량 선택</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehSelectRow}>
                  {vehicles.map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.vehSelectChip, formVehicleId === v.id && styles.vehSelectChipActive]}
                      onPress={() => setFormVehicleId(v.id)}
                    >
                      <Text style={[styles.vehSelectText, formVehicleId === v.id && styles.vehSelectTextActive]}>
                        {v.plate_number}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>일자 (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formDate}
                  onChangeText={setFormDate}
                  placeholder="2024-11-15"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {activeTab === 'trips' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>운행 거리 (km)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={distanceKm}
                    onChangeText={setDistanceKm}
                    placeholder="150"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              )}

              {activeTab === 'energy' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      주유/충전량 ({getFuelUnit(selectedVehicleObj?.fuel_type || 'gasoline')})
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={energyAmount}
                      onChangeText={(val) => {
                        setEnergyAmount(val);
                        const amt = parseFloat(val);
                        const unit = parseInt(energyUnitPrice, 10);
                        if (!isNaN(amt) && !isNaN(unit)) {
                          setEnergyTotalCost(String(Math.round(amt * unit)));
                        }
                      }}
                      placeholder="45"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>단가 (원/{getFuelUnit(selectedVehicleObj?.fuel_type || 'gasoline')})</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={energyUnitPrice}
                      onChangeText={(val) => {
                        setEnergyUnitPrice(val);
                        const amt = parseFloat(energyAmount);
                        const unit = parseInt(val, 10);
                        if (!isNaN(amt) && !isNaN(unit)) {
                          setEnergyTotalCost(String(Math.round(amt * unit)));
                        }
                      }}
                      placeholder="1700"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>총 결제 금액 (원)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={energyTotalCost}
                      onChangeText={setEnergyTotalCost}
                      placeholder="76500"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </>
              )}

              {activeTab === 'maintenance' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>정비 항목명</Text>
                    <TextInput
                      style={styles.textInput}
                      value={maintItemName}
                      onChangeText={setMaintItemName}
                      placeholder="엔진오일 교환, 타이어 교체 등"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>정비 비용 (원)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={maintCost}
                      onChangeText={setMaintCost}
                      placeholder="120000"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>메모</Text>
                <TextInput
                  style={[styles.textInput, { height: 60 }]}
                  multiline
                  value={formMemo}
                  onChangeText={setFormMemo}
                  placeholder="방문지, 주유소명, 정비센터 등"
                  placeholderTextColor="#94A3B8"
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#0D9488',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0D9488',
    fontWeight: '800',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterChips: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 10,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#0D9488',
  },
  filterChipText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0D9488',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
    gap: 10,
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
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  modelSub: {
    fontSize: 11,
    color: '#64748B',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  maintItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  mainStat: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D9488',
  },
  subStat: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  memoText: {
    fontSize: 11,
    color: '#64748B',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 6,
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
  vehSelectRow: {
    flexDirection: 'row',
    gap: 6,
  },
  vehSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  vehSelectChipActive: {
    backgroundColor: '#0D9488',
  },
  vehSelectText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  vehSelectTextActive: {
    color: '#FFFFFF',
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
});

