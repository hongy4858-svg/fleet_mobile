import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const { signIn, signUp, isConfigured, configError } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('이메일을 입력해 주세요.');
      return;
    }
    if (!password) {
      setErrorMessage('비밀번호를 입력해 주세요.');
      return;
    }

    if (tab === 'signup') {
      if (password.length < 6) {
        setErrorMessage('비밀번호는 최소 6자 이상이어야 합니다.');
        return;
      }
      if (password !== passwordConfirm) {
        setErrorMessage('비밀번호가 일치하지 않습니다.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (tab === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrorMessage('이메일 또는 비밀번호가 올바르지 않습니다.');
          } else {
            setErrorMessage(error.message);
          }
          return;
        }
        handleClose();
      } else {
        const { error, user } = await signUp(email, password);
        if (error) {
          setErrorMessage(error.message);
          return;
        }
        if (user && user.identities && user.identities.length === 0) {
          setErrorMessage('이미 등록된 이메일 계정입니다.');
          return;
        }
        setSuccessMessage('회원가입이 완료되었습니다! 바로 로그인됩니다.');
        setTimeout(() => {
          handleClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || '인증 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
          >
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                  <Ionicons name="shield-checkmark" size={22} color="#0D9488" />
                  <Text style={styles.cardTitle}>
                    {tab === 'signin' ? '플릿 매니저 로그인' : '새 계정 생성'}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={22} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Supabase 설정 오류 안내 */}
              {!isConfigured && (
                <View style={styles.configErrorBox}>
                  <Ionicons name="warning" size={16} color="#DC2626" />
                  <Text style={styles.configErrorText}>{configError}</Text>
                </View>
              )}

              {/* Tab Selector */}
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[styles.tabButton, tab === 'signin' && styles.activeTabButton]}
                  onPress={() => {
                    setTab('signin');
                    setErrorMessage(null);
                  }}
                >
                  <Text style={[styles.tabText, tab === 'signin' && styles.activeTabText]}>로그인</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, tab === 'signup' && styles.activeTabButton]}
                  onPress={() => {
                    setTab('signup');
                    setErrorMessage(null);
                  }}
                >
                  <Text style={[styles.tabText, tab === 'signup' && styles.activeTabText]}>회원가입</Text>
                </TouchableOpacity>
              </View>

              {/* Error / Success Alerts */}
              {errorMessage && (
                <View style={styles.alertError}>
                  <Ionicons name="alert-circle" size={16} color="#B91C1C" />
                  <Text style={styles.alertErrorText}>{errorMessage}</Text>
                </View>
              )}
              {successMessage && (
                <View style={styles.alertSuccess}>
                  <Ionicons name="checkmark-circle" size={16} color="#047857" />
                  <Text style={styles.alertSuccessText}>{successMessage}</Text>
                </View>
              )}

              {/* Form Inputs */}
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>이메일 주소</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="fleet@company.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>비밀번호</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="최소 6자 이상"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                {tab === 'signup' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>비밀번호 확인</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="비밀번호 재입력"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry
                      value={passwordConfirm}
                      onChangeText={setPasswordConfirm}
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.submitButton, (!isConfigured || submitting) && styles.disabledButton]}
                  onPress={handleSubmit}
                  disabled={!isConfigured || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {tab === 'signin' ? '로그인하기' : '회원가입 완료'}
                    </Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.notice}>
                  * 개인 및 기업 전용 플릿 데이터는 고유 식별자(UUID)로 격리되어 안전하게 보호됩니다.
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  configErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  configErrorText: {
    fontSize: 12,
    color: '#B91C1C',
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#0D9488',
    fontWeight: '800',
  },
  alertError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  alertErrorText: {
    fontSize: 12,
    color: '#B91C1C',
    flex: 1,
  },
  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  alertSuccessText: {
    fontSize: 12,
    color: '#047857',
    flex: 1,
  },
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  notice: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
  },
});

