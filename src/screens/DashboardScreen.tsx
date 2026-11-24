import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabaseFleetRepository } from '../services/supabaseRepository';
import { Vehicle, TripLog, EnergyLog, MaintenanceLog } from '../types';
import { calculateFleetMetrics } from '../utils/metrics';
import { formatCurrency, formatDistance, getFuelTypeLabel } from '../utils/formatters';
import { CostPerKmChart } from '../components/charts/CostPerKmChart';
import { useAuth } from '../contexts/AuthContext';

export const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<TripLog[]>([]);
  const [energy, setEnergy] = useState<EnergyLog[]>([]);
  const [maint, setMaint] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 기간 필터: 'all' | '1m' | '3m' | '6m' | '1y'
  const [periodPreset, setPeriodPreset] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

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
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePresetChange = (preset: string) => {
    setPeriodPreset(preset);
    const today = new Date();
    const endStr = today.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }

    const start = new Date(today);
    if (preset === '1m') start.setMonth(today.getMonth() - 1);
    else if (preset === '3m') start.setMonth(today.getMonth() - 3);
    else if (preset === '6m') start.setMonth(today.getMonth() - 6);
    else if (preset === '1y') start.setFullYear(today.getFullYear() - 1);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(endStr);
  };

  const metrics = useMemo(() => {
    return calculateFleetMetrics(vehicles, trips, energy, maint, startDate, endDate);
  }, [vehicles, trips, energy, maint, startDate, endDate]);

  const chartData = useMemo(() => {
    return metrics.vehicle_summaries
      .filter((s) => s.total_distance_km > 0)
      .map((s) => ({
        name: s.model_name.split('(')[0].trim(),
        plate: s.plate_number,
        costPerKm: s.cost_per_km || 0,
        fuelType: s.fuel_type,
        distance: s.total_distance_km,
        operatingCost: s.total_operating_cost,
      }))
      .sort((a, b) => (b.costPerKm || 0) - (a.costPerKm || 0));
  }, [metrics]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>플릿 운영 데이터를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />}
    >
      {/* 에러 배너 */}
      {errorMessage && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#B91C1C" />
          <View style={{ flex: 1 }}>
            <Text style={styles.errorTitle}>클라우드 데이터베이스 통신 오류</Text>
            <Text style={styles.errorDesc}>{errorMessage}</Text>
          </View>
        </View>
      )}

      {/* 차량 0대 안내 배너 */}
      {vehicles.length === 0 && !errorMessage && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#0D9488" />
          <Text style={styles.infoText}>
            현재 계정에 등록된 차량 데이터가 없습니다. 상단 우측 [시연생성]을 누르면 기본 샘플 데이터가 등록됩니다.
          </Text>
        </View>
      )}

      {/* 기간 필터 */}
      <View style={styles.filterCard}>
        <Text style={styles.filterLabel}>운영 실적 분석 기간</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
          {[
            { id: 'all', label: '전체' },
            { id: '1m', label: '최근 1개월' },
            { id: '3m', label: '최근 3개월' },
            { id: '6m', label: '최근 6개월' },
            { id: '1y', label: '최근 1년' },
          ].map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.presetButton, periodPreset === p.id && styles.presetButtonActive]}
              onPress={() => handlePresetChange(p.id)}
            >
              <Text style={[styles.presetText, periodPreset === p.id && styles.presetTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 플릿 운영 KPI 4대 핵심 지표 */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiTitle}>보유 차량수</Text>
            <Ionicons name="car-outline" size={18} color="#0D9488" />
          </View>
          <Text style={styles.kpiValue}>{metrics.total_vehicles}대</Text>
          <Text style={styles.kpiSub}>총 등록 자산</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiTitle}>총 주행거리</Text>
            <Ionicons name="speedometer-outline" size={18} color="#0284C7" />
          </View>
          <Text style={styles.kpiValue}>{formatDistance(metrics.total_distance_km)}</Text>
          <Text style={styles.kpiSub}>{metrics.vehicle_summaries.length}대 집계</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiTitle}>총 에너지비용</Text>
            <Ionicons name="flame-outline" size={18} color="#EA580C" />
          </View>
          <Text style={styles.kpiValue}>{formatCurrency(metrics.total_energy_cost)}</Text>
          <Text style={styles.kpiSub}>연료 및 충전비</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiTitle}>평균 km당 비용</Text>
            <Ionicons name="calculator-outline" size={18} color="#10B981" />
          </View>
          <Text style={styles.kpiValue}>
            {metrics.average_cost_per_km ? `${Math.round(metrics.average_cost_per_km).toLocaleString()}원` : '-'}
          </Text>
          <Text style={styles.kpiSub}>운영비/주행거리</Text>
        </View>
      </View>

      {/* 총 운영비용 요약 박스 */}
      <View style={styles.totalCostBox}>
        <View style={styles.totalCostRow}>
          <Text style={styles.totalCostLabel}>플릿 전체 총 운영비용</Text>
          <Text style={styles.totalCostValue}>{formatCurrency(metrics.total_operating_cost)}</Text>
        </View>
        <Text style={styles.totalCostDetail}>
          연료·충전비 {formatCurrency(metrics.total_energy_cost)} + 정비비 {formatCurrency(metrics.total_maintenance_cost)}
        </Text>
      </View>

      {/* km당 운영비용 비교 차트 */}
      <CostPerKmChart data={chartData} />

      {/* 차량별 운영 실적 목록 */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>차량별 세부 운영 실적</Text>
        {metrics.vehicle_summaries.map((item) => (
          <View key={item.vehicle_id} style={styles.vehicleCard}>
            <View style={styles.vehicleCardTop}>
              <View>
                <Text style={styles.vehPlate}>{item.plate_number}</Text>
                <Text style={styles.vehModel}>{item.model_name}</Text>
              </View>
              <View style={styles.vehBadge}>
                <Text style={styles.vehBadgeText}>{getFuelTypeLabel(item.fuel_type)}</Text>
              </View>
            </View>

            <View style={styles.vehStatsGrid}>
              <View style={styles.vehStatCol}>
                <Text style={styles.statLabel}>주행거리</Text>
                <Text style={styles.statVal}>{formatDistance(item.total_distance_km)}</Text>
              </View>
              <View style={styles.vehStatCol}>
                <Text style={styles.statLabel}>연료/충전비</Text>
                <Text style={styles.statVal}>{formatCurrency(item.total_energy_cost)}</Text>
              </View>
              <View style={styles.vehStatCol}>
                <Text style={styles.statLabel}>정비비</Text>
                <Text style={styles.statVal}>{formatCurrency(item.total_maintenance_cost)}</Text>
              </View>
              <View style={styles.vehStatCol}>
                <Text style={styles.statLabel}>km당 단가</Text>
                <Text style={[styles.statVal, { color: '#0D9488', fontWeight: '800' }]}>
                  {item.cost_per_km ? `${Math.round(item.cost_per_km)}원/km` : '-'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
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
    gap: 16,
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
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 14,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  errorDesc: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#0F766E',
    flex: 1,
    lineHeight: 17,
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  presetButtonActive: {
    backgroundColor: '#0D9488',
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexGrow: 1,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  totalCostBox: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
  },
  totalCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalCostLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  totalCostValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2DD4BF',
  },
  totalCostDetail: {
    fontSize: 11,
    color: '#64748B',
  },
  summarySection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  vehicleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehPlate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  vehModel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  vehBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vehBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  vehStatsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    justifyContent: 'space-between',
  },
  vehStatCol: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 2,
  },
  statVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
});
