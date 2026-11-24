import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { supabaseFleetRepository } from '../services/supabaseRepository';
import {
  Vehicle,
  ReplacementCandidate,
  TripLog,
  EnergyLog,
  MaintenanceLog,
  FuelType,
  AnalysisInputSnapshot,
} from '../types';
import { evaluateFleetReplacement } from '../utils/economics';
import { getVehicleHistoricalEstimates } from '../utils/metrics';
import {
  formatCurrency,
  getEfficiencyUnit,
} from '../utils/formatters';
import { CostComparisonChart } from '../components/charts/CostComparisonChart';
import { useAuth } from '../contexts/AuthContext';

export const AnalysisScreen: React.FC = () => {
  const { user } = useAuth();
  const route = useRoute<any>();
  const clonedInput: AnalysisInputSnapshot | undefined = route.params?.clonedInput;

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [candidates, setCandidates] = useState<ReplacementCandidate[]>([]);
  const [trips, setTrips] = useState<TripLog[]>([]);
  const [energy, setEnergy] = useState<EnergyLog[]>([]);
  const [maint, setMaint] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. 공통 분석 조건
  const [analysisTitle, setAnalysisTitle] = useState('업무용 차량 유지 vs 친환경차 교체 경제성 분석');
  const [periodYears, setPeriodYears] = useState('5');
  const [annualDistance, setAnnualDistance] = useState('20000');
  const [discountRate, setDiscountRate] = useState('4.5');

  // 2. 대안 A: 기존 차량 유지 파라미터
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [existingMarketValue, setExistingMarketValue] = useState('12000000'); // 현재 매각가 S_0
  const [existingEfficiency, setExistingEfficiency] = useState('11.2');
  const [existingEnergyPrice, setExistingEnergyPrice] = useState('1720');
  const [existingMaint, setExistingMaint] = useState('900000');
  const [existingTax, setExistingTax] = useState('520000');
  const [existingInsurance, setExistingInsurance] = useState('850000');
  const [existingSalvage, setExistingSalvage] = useState('3000000'); // N년 후 잔존가치

  // DB 실적 참고값
  const [dbRef, setDbRef] = useState<{
    referenceEfficiency: number;
    referenceEnergyPrice: number;
    referenceAnnualMaintenance: number;
    totalTripCount: number;
  } | null>(null);

  // 3. 대안 B: 신차 교체 파라미터
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [newModelName, setNewModelName] = useState('현대 아이오닉 6 익스클루시브 (전기차)');
  const [newFuelType, setNewFuelType] = useState<FuelType>('electric');
  const [newPurchasePrice, setNewPurchasePrice] = useState('52000000');
  const [newSubsidy, setNewSubsidy] = useState('6800000');
  const [newIncidental, setNewIncidental] = useState('2200000');
  const [newEfficiency, setNewEfficiency] = useState('6.2');
  const [newEnergyPrice, setNewEnergyPrice] = useState('340');
  const [newMaint, setNewMaint] = useState('350000');
  const [newTax, setNewTax] = useState('130000');
  const [newInsurance, setNewInsurance] = useState('900000');
  const [newSalvage, setNewSalvage] = useState('19000000');

  // 저장 모달
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const loadBaseData = useCallback(async () => {
    try {
      if (!user) {
        setVehicles([]);
        setCandidates([]);
        setTrips([]);
        setEnergy([]);
        setMaint([]);
        setLoading(false);
        return;
      }
      const [vList, cList, tList, eList, mList] = await Promise.all([
        supabaseFleetRepository.getVehicles(),
        supabaseFleetRepository.getReplacementCandidates(),
        supabaseFleetRepository.getTripLogs(),
        supabaseFleetRepository.getEnergyLogs(),
        supabaseFleetRepository.getMaintenanceLogs(),
      ]);
      setVehicles(vList);
      setCandidates(cList);
      setTrips(tList);
      setEnergy(eList);
      setMaint(mList);

      if (clonedInput) {
        // 복제본 파라미터 복원
        setAnalysisTitle(`${clonedInput.analysis_name} (재분석)`);
        setPeriodYears(String(clonedInput.analysis_period_years));
        setAnnualDistance(String(clonedInput.annual_distance_km));
        setDiscountRate(String(clonedInput.discount_rate_pct));

        setSelectedVehicleId(clonedInput.existing.vehicle_id);
        setExistingMarketValue(String(clonedInput.existing.current_market_value));
        setExistingEfficiency(String(clonedInput.existing.efficiency));
        setExistingEnergyPrice(String(clonedInput.existing.energy_price));
        setExistingMaint(String(clonedInput.existing.annual_maintenance));
        setExistingTax(String(clonedInput.existing.annual_tax));
        setExistingInsurance(String(clonedInput.existing.annual_insurance));
        setExistingSalvage(String(clonedInput.existing.expected_salvage_value));

        setNewModelName(clonedInput.replacement.model_name);
        setNewFuelType(clonedInput.replacement.fuel_type);
        setNewPurchasePrice(String(clonedInput.replacement.purchase_price));
        setNewSubsidy(String(clonedInput.replacement.subsidy));
        setNewIncidental(String(clonedInput.replacement.incidental_cost));
        setNewEfficiency(String(clonedInput.replacement.efficiency));
        setNewEnergyPrice(String(clonedInput.replacement.energy_price));
        setNewMaint(String(clonedInput.replacement.annual_maintenance));
        setNewTax(String(clonedInput.replacement.annual_tax));
        setNewInsurance(String(clonedInput.replacement.annual_insurance));
        setNewSalvage(String(clonedInput.replacement.expected_salvage_value));
      } else {
        if (vList.length > 0) {
          applyExistingVehicle(vList[0], tList, eList, mList);
        }
        if (cList.length > 0) {
          applyCandidate(cList[0]);
        }
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('데이터 로드 실패', err.message);
    } finally {
      setLoading(false);
    }
  }, [user, clonedInput]);

  useEffect(() => {
    setLoading(true);
    loadBaseData();
  }, [loadBaseData]);

  const applyExistingVehicle = (v: Vehicle, tList = trips, eList = energy, mList = maint) => {
    setSelectedVehicleId(v.id);
    const est = getVehicleHistoricalEstimates(v, tList, eList, mList);
    setDbRef({
      referenceEfficiency: est.referenceEfficiency,
      referenceEnergyPrice: est.referenceEnergyPrice,
      referenceAnnualMaintenance: est.referenceAnnualMaintenance,
      totalTripCount: est.totalTripCount,
    });
    setExistingEfficiency(String(est.referenceEfficiency));
    setExistingEnergyPrice(String(est.referenceEnergyPrice));
    setExistingMaint(String(est.referenceAnnualMaintenance));
    setExistingTax(v.fuel_type === 'electric' ? '130000' : '520000');
    setExistingInsurance('850000');
    setExistingSalvage('3000000');
    setExistingMarketValue('12000000');
  };

  const applyCandidate = (c: ReplacementCandidate) => {
    setSelectedCandidateId(c.id);
    setNewModelName(c.name);
    setNewFuelType(c.fuel_type);
    setNewPurchasePrice(String(c.purchase_price));
    setNewSubsidy(String(c.subsidy));
    setNewIncidental(String(c.incidental_cost));
    setNewEfficiency(String(c.efficiency));
    setNewEnergyPrice(String(c.energy_price));
    setNewMaint(String(c.annual_maintenance));
    setNewTax(String(c.annual_tax));
    setNewInsurance(String(c.annual_insurance));
    setNewSalvage(String(c.expected_salvage));
  };

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId);
  }, [vehicles, selectedVehicleId]);

  // 분석 입력 스냅샷 객체 생성
  const currentInputSnapshot: AnalysisInputSnapshot = useMemo(() => {
    const n = parseInt(periodYears, 10) || 5;
    const dist = parseInt(annualDistance, 10) || 20000;
    const rate = parseFloat(discountRate) || 4.5;

    return {
      analysis_name: analysisTitle,
      analysis_period_years: n,
      annual_distance_km: dist,
      discount_rate_pct: rate,
      existing: {
        vehicle_id: selectedVehicleId || '',
        plate_number: selectedVehicle?.plate_number || '',
        model_name: selectedVehicle?.model_name || '',
        fuel_type: selectedVehicle?.fuel_type || 'gasoline',
        current_market_value: parseInt(existingMarketValue, 10) || 0,
        efficiency: parseFloat(existingEfficiency) || 1,
        energy_price: parseFloat(existingEnergyPrice) || 0,
        annual_maintenance: parseInt(existingMaint, 10) || 0,
        annual_tax: parseInt(existingTax, 10) || 0,
        annual_insurance: parseInt(existingInsurance, 10) || 0,
        expected_salvage_value: parseInt(existingSalvage, 10) || 0,
      },
      replacement: {
        candidate_id: selectedCandidateId,
        model_name: newModelName,
        fuel_type: newFuelType,
        purchase_price: parseInt(newPurchasePrice, 10) || 0,
        subsidy: parseInt(newSubsidy, 10) || 0,
        incidental_cost: parseInt(newIncidental, 10) || 0,
        efficiency: parseFloat(newEfficiency) || 1,
        energy_price: parseFloat(newEnergyPrice) || 0,
        annual_maintenance: parseInt(newMaint, 10) || 0,
        annual_tax: parseInt(newTax, 10) || 0,
        annual_insurance: parseInt(newInsurance, 10) || 0,
        expected_salvage_value: parseInt(newSalvage, 10) || 0,
      },
    };
  }, [
    analysisTitle,
    periodYears,
    annualDistance,
    discountRate,
    selectedVehicleId,
    selectedVehicle,
    existingMarketValue,
    existingEfficiency,
    existingEnergyPrice,
    existingMaint,
    existingTax,
    existingInsurance,
    existingSalvage,
    selectedCandidateId,
    newModelName,
    newFuelType,
    newPurchasePrice,
    newSubsidy,
    newIncidental,
    newEfficiency,
    newEnergyPrice,
    newMaint,
    newTax,
    newInsurance,
    newSalvage,
  ]);

  // 경제성 분석 결과 실시간 평가
  const analysisResult = useMemo(() => {
    return evaluateFleetReplacement(currentInputSnapshot);
  }, [currentInputSnapshot]);

  const handleOpenSaveModal = () => {
    setSaveTitle(analysisTitle);
    setSaveModalVisible(true);
  };

  const handleSaveSnapshot = async () => {
    if (!saveTitle.trim()) {
      Alert.alert('알림', '분석 명칭을 입력해 주세요.');
      return;
    }

    setSaving(true);
    try {
      const snapshotToSave: AnalysisInputSnapshot = {
        ...currentInputSnapshot,
        analysis_name: saveTitle.trim(),
      };

      await supabaseFleetRepository.saveAnalysis({
        owner_id: user?.id || '',
        title: saveTitle.trim(),
        existing_vehicle_id: selectedVehicleId || (vehicles[0]?.id ?? ''),
        replacement_candidate_id: selectedCandidateId || undefined,
        input_snapshot: snapshotToSave,
        result_snapshot: analysisResult,
      });

      setSaveModalVisible(false);
      Alert.alert('저장 완료', '분석 스냅샷이 안전하게 클라우드 DB에 보존되었습니다.');
    } catch (err: any) {
      Alert.alert('저장 오류', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>경제성 분석 모델을 초기화하는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. 공통 분석 조건 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>1. 공통 분석 전제 조건</Text>
        <View style={styles.grid2}>
          <View style={styles.field}>
            <Text style={styles.label}>분석 기간 (N년)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={periodYears}
              onChangeText={setPeriodYears}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>연간 예상 주행거리 (km)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={annualDistance}
              onChangeText={setAnnualDistance}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>할인율 (%)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={discountRate}
              onChangeText={setDiscountRate}
            />
          </View>
        </View>
      </View>

      {/* 2. 대안 A: 기존 차량 유지 */}
      <View style={styles.card}>
        <View style={styles.headerBetween}>
          <Text style={styles.cardTitle}>대안 1: 기존 차량 유지</Text>
          <Text style={styles.subBadge}>보유차 계속 운행</Text>
        </View>

        <Text style={styles.label}>비교 대상 보유 차량 선택</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {vehicles.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={[styles.vehChip, selectedVehicleId === v.id && styles.vehChipActive]}
              onPress={() => applyExistingVehicle(v)}
            >
              <Text style={[styles.vehChipText, selectedVehicleId === v.id && styles.vehChipTextActive]}>
                {v.plate_number}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {dbRef && (
          <View style={styles.refBox}>
            <Ionicons name="information-circle-outline" size={16} color="#0D9488" />
            <Text style={styles.refText}>
              DB 실적 참고치: 실적연비 {dbRef.referenceEfficiency} | 최근단가{' '}
              {dbRef.referenceEnergyPrice.toLocaleString()}원 | 누적운행 {dbRef.totalTripCount}건
            </Text>
          </View>
        )}

        <View style={styles.sunkCostNotice}>
          <Ionicons name="alert-circle-outline" size={14} color="#D97706" />
          <Text style={styles.sunkCostText}>
            매몰비용 원칙: 과거 차량 구매가는 회수 불가능한 매몰비용이므로 미래 의사결정 비용에 가산하지 않습니다.
          </Text>
        </View>

        <View style={styles.grid2}>
          <View style={styles.field}>
            <Text style={styles.label}>현재 매각가 (S₀ 기회비용)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={existingMarketValue}
              onChangeText={setExistingMarketValue}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>예상 연비 ({getEfficiencyUnit(selectedVehicle?.fuel_type || 'gasoline')})</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={existingEfficiency}
              onChangeText={setExistingEfficiency}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>에너지 단가 (원)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={existingEnergyPrice}
              onChangeText={setExistingEnergyPrice}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>연간 정비비 (원)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={existingMaint}
              onChangeText={setExistingMaint}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>연간 세금/보험 (원)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String((parseInt(existingTax, 10) || 0) + (parseInt(existingInsurance, 10) || 0))}
              onChangeText={(val) => {
                const num = parseInt(val, 10) || 0;
                setExistingTax(String(Math.round(num * 0.4)));
                setExistingInsurance(String(Math.round(num * 0.6)));
              }}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{periodYears}년 후 잔존가치 (원)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={existingSalvage}
              onChangeText={setExistingSalvage}
            />
          </View>
        </View>
      </View>

      {/* 3. 대안 B: 신차 교체 */}
      <View style={styles.card}>
        <View style={styles.headerBetween}>
          <Text style={styles.cardTitle}>대안 2: 친환경 신차 교체</Text>
          <Text style={[styles.subBadge, { backgroundColor: '#CCFBF1', color: '#0F766E' }]}>
            신차 도입
          </Text>
        </View>

        <Text style={styles.label}>교체 후보 템플릿 선택</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {candidates.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.vehChip, selectedCandidateId === c.id && styles.vehChipActive]}
              onPress={() => applyCandidate(c)}
            >
              <Text style={[styles.vehChipText, selectedCandidateId === c.id && styles.vehChipTextActive]}>
                {c.name.split('(')[0].trim()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.grid2}>
          <View style={[styles.field, { width: '100%' }]}>
            <Text style={styles.label}>교체 모델명</Text>
            <TextInput style={styles.input} value={newModelName} onChangeText={setNewModelName} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>차량 정가 (원)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={newPurchasePrice}
              onChangeText={setNewPurchasePrice}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>구매 보조금 (원)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={newSubsidy}
              onChangeText={setNewSubsidy}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>취등록세/부대비용 (원)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={newIncidental}
              onChangeText={setNewIncidental}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>공인 연비 ({getEfficiencyUnit(newFuelType)})</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={newEfficiency}
              onChangeText={setNewEfficiency}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>에너지 단가 (원)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={newEnergyPrice}
              onChangeText={setNewEnergyPrice}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>연간 정비비 (원)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={newMaint}
              onChangeText={setNewMaint}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>연간 세금/보험 (원)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String((parseInt(newTax, 10) || 0) + (parseInt(newInsurance, 10) || 0))}
              onChangeText={(val) => {
                const num = parseInt(val, 10) || 0;
                setNewTax(String(Math.round(num * 0.2)));
                setNewInsurance(String(Math.round(num * 0.8)));
              }}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{periodYears}년 후 잔존가치 (원)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={newSalvage}
              onChangeText={setNewSalvage}
            />
          </View>
        </View>
      </View>

      {/* 4. 경제성 분석 결과 평가 리포트 */}
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>{periodYears}년간 총비용 현재가치(PV) 평가</Text>
          <View
            style={[
              styles.recBadge,
              analysisResult.recommended_alternative === 'replace'
                ? styles.recBadgeReplace
                : styles.recBadgeKeep,
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={analysisResult.recommended_alternative === 'replace' ? '#0F766E' : '#B45309'}
            />
            <Text
              style={[
                styles.recBadgeText,
                analysisResult.recommended_alternative === 'replace'
                  ? styles.recTextReplace
                  : styles.recTextKeep,
              ]}
            >
              {analysisResult.recommended_alternative === 'replace'
                ? '친환경 신차 [교체] 유리'
                : '기존 차량 [유지] 유리'}
            </Text>
          </View>
        </View>

        <View style={styles.savingsBanner}>
          <Text style={styles.savingsLabel}>현재가치(PV) 기준 절감 예상액</Text>
          <Text style={styles.savingsValue}>{formatCurrency(analysisResult.savings_amount)} 절감</Text>
        </View>

        {/* 차트 컴포넌트 */}
        <CostComparisonChart result={analysisResult} />

        <TouchableOpacity style={styles.saveAnalysisBtn} onPress={handleOpenSaveModal}>
          <Ionicons name="save-outline" size={18} color="#FFFFFF" />
          <Text style={styles.saveAnalysisBtnText}>분석 결과 스냅샷 저장</Text>
        </TouchableOpacity>
      </View>

      {/* 분석 저장 모달 */}
      <Modal visible={saveModalVisible} transparent animationType="fade" onRequestClose={() => setSaveModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.saveModalCard}>
            <Text style={styles.saveModalTitle}>분석 결과 스냅샷 보존</Text>
            <Text style={styles.saveModalSub}>
              현재 입력된 모든 계산 파라미터와 결과를 불변 스냅샷으로 저장합니다.
            </Text>

            <View style={{ gap: 6, marginVertical: 12 }}>
              <Text style={styles.label}>분석 명칭</Text>
              <TextInput
                style={styles.input}
                value={saveTitle}
                onChangeText={setSaveTitle}
                placeholder="예: 그랜저 vs 아이오닉 6 5개년 경제성 분석"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSaveModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveSnapshot}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>클라우드 저장</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  field: {
    width: '48%',
    gap: 4,
    flexGrow: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4,
  },
  vehChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  vehChipActive: {
    backgroundColor: '#0D9488',
  },
  vehChipText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  vehChipTextActive: {
    color: '#FFFFFF',
  },
  refBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    borderRadius: 8,
    padding: 8,
  },
  refText: {
    fontSize: 10,
    color: '#0F766E',
    flex: 1,
    lineHeight: 14,
  },
  sunkCostNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 8,
  },
  sunkCostText: {
    fontSize: 10,
    color: '#B45309',
    flex: 1,
    lineHeight: 14,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  recBadgeReplace: {
    backgroundColor: '#CCFBF1',
  },
  recBadgeKeep: {
    backgroundColor: '#FEF3C7',
  },
  recBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  recTextReplace: {
    color: '#0F766E',
  },
  recTextKeep: {
    color: '#B45309',
  },
  savingsBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  savingsValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2DD4BF',
  },
  saveAnalysisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  saveAnalysisBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  saveModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  saveModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  saveModalSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
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
