import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { FuelType } from '../../types';
import { getFuelTypeLabel, formatCurrency } from '../../utils/formatters';

interface VehicleCostItem {
  name: string;
  plate: string;
  costPerKm: number;
  fuelType: FuelType;
  distance: number;
  operatingCost: number;
}

interface CostPerKmChartProps {
  data: VehicleCostItem[];
}

const getFuelBadgeColor = (fuelType: FuelType): { bg: string; text: string; bar: string } => {
  switch (fuelType) {
    case 'electric':
      return { bg: '#CCFBF1', text: '#0F766E', bar: '#0D9488' }; // Teal
    case 'hydrogen':
      return { bg: '#E0F2FE', text: '#0369A1', bar: '#0284C7' }; // Sky
    case 'hybrid':
      return { bg: '#D1FAE5', text: '#047857', bar: '#10B981' }; // Emerald
    case 'diesel':
      return { bg: '#FEF3C7', text: '#B45309', bar: '#F59E0B' }; // Amber
    case 'gasoline':
    default:
      return { bg: '#F1F5F9', text: '#475569', bar: '#64748B' }; // Slate
  }
};

export const CostPerKmChart: React.FC<CostPerKmChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>운행 및 비용 실적이 있는 차량이 없습니다.</Text>
      </View>
    );
  }

  const maxCost = Math.max(...data.map((d) => d.costPerKm), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>차량별 km당 운영비용 (연료비+정비비 / 주행거리)</Text>
      <View style={styles.list}>
        {data.map((item, idx) => {
          const colors = getFuelBadgeColor(item.fuelType);
          const ratio = Math.min(Math.max(item.costPerKm / maxCost, 0.05), 1);
          return (
            <View key={idx} style={styles.row}>
              <View style={styles.rowHeader}>
                <View style={styles.nameRow}>
                  <Text style={styles.plateNumber}>{item.plate}</Text>
                  <Text style={styles.modelName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.badgeText, { color: colors.text }]}>
                    {getFuelTypeLabel(item.fuelType)}
                  </Text>
                </View>
              </View>

              <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: colors.bar }]} />
              </View>

              <View style={styles.rowFooter}>
                <Text style={styles.costText}>
                  <Text style={styles.costHighlight}>{Math.round(item.costPerKm).toLocaleString()}</Text> 원/km
                </Text>
                <Text style={styles.subText}>
                  주행 {item.distance.toLocaleString()}km | 운영비 {formatCurrency(item.operatingCost)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  list: {
    gap: 12,
  },
  row: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  plateNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  modelName: {
    fontSize: 12,
    color: '#64748B',
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  barContainer: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  rowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costText: {
    fontSize: 12,
    color: '#334155',
  },
  costHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  subText: {
    fontSize: 11,
    color: '#94A3B8',
  },
});

