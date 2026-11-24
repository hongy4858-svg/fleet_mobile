import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AnalysisResultSnapshot } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface CostComparisonChartProps {
  result: AnalysisResultSnapshot;
}

export const CostComparisonChart: React.FC<CostComparisonChartProps> = ({ result }) => {
  const { keep_breakdown, replace_breakdown, recommended_alternative } = result;

  const maxPv = Math.max(keep_breakdown.pv_total_cost, replace_breakdown.pv_total_cost, 1);
  const keepRatio = Math.max(keep_breakdown.pv_total_cost / maxPv, 0.05);
  const replaceRatio = Math.max(replace_breakdown.pv_total_cost / maxPv, 0.05);

  const isReplaceAdvantage = recommended_alternative === 'replace';

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>대안별 총비용 현재가치(PV) 비교</Text>
      <Text style={styles.subTitle}>
        * 초기 순투자액 + 기간 내 운영비(연료+정비+세금/보험)의 현재가치 합계 (잔존가치 차감 반영)
      </Text>

      {/* 대안 A vs 대안 B 바 비교 */}
      <View style={styles.comparisonBox}>
        {/* 기존차 유지 대안 */}
        <View style={styles.altItem}>
          <View style={styles.altLabelRow}>
            <Text style={styles.altName}>대안 1: 기존 차량 유지</Text>
            <Text style={styles.altPvText}>{formatCurrency(keep_breakdown.pv_total_cost)}</Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.round(keepRatio * 100)}%`,
                  backgroundColor: !isReplaceAdvantage ? '#0D9488' : '#64748B',
                },
              ]}
            />
          </View>
        </View>

        {/* 신차 교체 대안 */}
        <View style={styles.altItem}>
          <View style={styles.altLabelRow}>
            <Text style={styles.altName}>대안 2: 친환경 신차 교체</Text>
            <Text
              style={[
                styles.altPvText,
                { color: isReplaceAdvantage ? '#2DD4BF' : '#F8FAFC' },
              ]}
            >
              {formatCurrency(replace_breakdown.pv_total_cost)}
            </Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.round(replaceRatio * 100)}%`,
                  backgroundColor: isReplaceAdvantage ? '#0D9488' : '#F59E0B',
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* 세부 항목별 분해 테이블 */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.colHeader, styles.colItem]}>비용 항목</Text>
          <Text style={[styles.colHeader, styles.colVal]}>기존차 유지</Text>
          <Text style={[styles.colHeader, styles.colVal]}>신차 교체</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.colItem}>초기 순투자액 (S₀ 차감)</Text>
          <Text style={styles.colVal}>0원</Text>
          <Text style={styles.colVal}>{formatCurrency(replace_breakdown.initial_net_investment)}</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.colItem}>연간 연료/충전비</Text>
          <Text style={styles.colVal}>{formatCurrency(keep_breakdown.annual_energy_cost)}/년</Text>
          <Text style={[styles.colVal, { color: '#2DD4BF' }]}>
            {formatCurrency(replace_breakdown.annual_energy_cost)}/년
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.colItem}>연간 정비비</Text>
          <Text style={styles.colVal}>{formatCurrency(keep_breakdown.annual_maintenance_cost)}/년</Text>
          <Text style={styles.colVal}>{formatCurrency(replace_breakdown.annual_maintenance_cost)}/년</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.colItem}>연간 세금/보험료</Text>
          <Text style={styles.colVal}>
            {formatCurrency(keep_breakdown.annual_tax_cost + keep_breakdown.annual_insurance_cost)}/년
          </Text>
          <Text style={styles.colVal}>
            {formatCurrency(replace_breakdown.annual_tax_cost + replace_breakdown.annual_insurance_cost)}/년
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.colItem}>운영비 총합 현재가치 (PV)</Text>
          <Text style={styles.colVal}>{formatCurrency(keep_breakdown.pv_operating_costs)}</Text>
          <Text style={[styles.colVal, { color: '#2DD4BF' }]}>
            {formatCurrency(replace_breakdown.pv_operating_costs)}
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.colItem}>잔존가치 회수 (차감) PV</Text>
          <Text style={[styles.colVal, { color: '#94A3B8' }]}>
            -{formatCurrency(keep_breakdown.pv_salvage_value)}
          </Text>
          <Text style={[styles.colVal, { color: '#94A3B8' }]}>
            -{formatCurrency(replace_breakdown.pv_salvage_value)}
          </Text>
        </View>

        <View style={[styles.tableRow, styles.totalRow]}>
          <Text style={[styles.colItem, styles.totalText]}>총비용 현재가치 (PV)</Text>
          <Text style={[styles.colVal, styles.totalText]}>
            {formatCurrency(keep_breakdown.pv_total_cost)}
          </Text>
          <Text
            style={[
              styles.colVal,
              styles.totalText,
              { color: isReplaceAdvantage ? '#2DD4BF' : '#F59E0B' },
            ]}
          >
            {formatCurrency(replace_breakdown.pv_total_cost)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    marginVertical: 12,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 16,
    lineHeight: 15,
  },
  comparisonBox: {
    gap: 14,
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  altItem: {
    gap: 6,
  },
  altLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  altName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  altPvText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  track: {
    height: 12,
    backgroundColor: '#1E293B',
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
  table: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 6,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  colItem: {
    flex: 1.4,
    fontSize: 11,
    color: '#CBD5E1',
  },
  colVal: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    marginTop: 4,
  },
  totalText: {
    fontWeight: '800',
    fontSize: 12,
  },
});
