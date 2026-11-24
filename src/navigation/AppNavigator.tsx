import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/DashboardScreen';
import { VehiclesScreen } from '../screens/VehiclesScreen';
import { LogsScreen } from '../screens/LogsScreen';
import { AnalysisScreen } from '../screens/AnalysisScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { AuthModal } from '../components/auth/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { supabaseFleetRepository } from '../services/supabaseRepository';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  const { user, signOut } = useAuth();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 시연 데이터 생성 핸들러
  const handleSeedDemoData = async () => {
    if (!user) {
      setAuthModalVisible(true);
      return;
    }
    setActionLoading(true);
    try {
      await supabaseFleetRepository.seedDemoDataForUser();
      Alert.alert('완료', '시연용 차량 5대 및 운행·비용 샘플 데이터가 성공적으로 생성되었습니다.');
    } catch (err: any) {
      Alert.alert('시연 데이터 생성 실패', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 초기화 핸들러
  const handleResetData = () => {
    if (!user) {
      setAuthModalVisible(true);
      return;
    }
    Alert.alert(
      '클라우드 데이터 초기화',
      '현재 계정의 모든 차량, 운행, 주유, 정비, 분석 이력이 삭제되고 기본 시연 데이터로 재설정됩니다. 진행하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화 실행',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await supabaseFleetRepository.resetToDemoData();
              Alert.alert('초기화 완료', '현재 계정의 데이터가 기본 시연 데이터로 재설정되었습니다.');
            } catch (err: any) {
              Alert.alert('초기화 실패', err.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 글로벌 상단 헤더 */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Ionicons name="leaf" size={16} color="#0D9488" />
          </View>
          <View>
            <Text style={styles.headerTitle}>친환경 플릿 매니저</Text>
            <Text style={styles.userStatus} numberOfLines={1}>
              {user ? user.email : '로그인 필요'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {actionLoading ? (
            <ActivityIndicator size="small" color="#0D9488" style={{ marginRight: 8 }} />
          ) : user ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.headerSeedBtn}
                onPress={handleSeedDemoData}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.headerSeedBtnText}>시연생성</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerResetBtn}
                onPress={handleResetData}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.headerResetBtnText}>초기화</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerAuthBtn}
                onPress={handleSignOut}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="log-out-outline" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => setAuthModalVisible(true)}
            >
              <Ionicons name="person-circle-outline" size={16} color="#FFFFFF" />
              <Text style={styles.loginBtnText}>로그인</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 5대 하단 탭 네비게이터 */}
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#0D9488',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E2E8F0',
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: '대시보드',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'speedometer' : 'speedometer-outline'} size={20} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Vehicles"
          component={VehiclesScreen}
          options={{
            tabBarLabel: '차량 관리',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'car' : 'car-outline'} size={20} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Logs"
          component={LogsScreen}
          options={{
            tabBarLabel: '운행·비용',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={20} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Analysis"
          component={AnalysisScreen}
          options={{
            tabBarLabel: '경제성 비교',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'calculator' : 'calculator-outline'} size={20} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            tabBarLabel: '분석 이력',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'time' : 'time-outline'} size={20} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      {/* 로그인/회원가입 모달 */}
      <AuthModal visible={authModalVisible} onClose={() => setAuthModalVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  userStatus: {
    fontSize: 11,
    color: '#64748B',
    maxWidth: 160,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerSeedBtn: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  headerSeedBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
  },
  headerResetBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  headerResetBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  headerAuthBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0D9488',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  loginBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

